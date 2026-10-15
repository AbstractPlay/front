/* eslint-env node */
/**
 * Sync csp-policy.mjs to the CloudFront response headers policy.
 *
 * play.dev / play.abstractplay.com enforce CSP via an HTTP response header from
 * CloudFront. Dev and prod distributions share the same response headers policy.
 */
import { execFileSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { CONTENT_SECURITY_POLICY } from "../csp-policy.mjs";
import { apCostAllocationTagItems } from "./apCostAllocationTags.mjs";

const STAGE_CONFIG = {
  dev: {
    domain: "play.dev.abstractplay.com",
    profile: "AbstractPlayDev",
  },
  prod: {
    domain: "play.abstractplay.com",
    profile: "AbstractPlayProd",
  },
};

function parseArgs() {
  const args = process.argv.slice(2);
  const stageIdx = args.indexOf("--stage");
  const stage = stageIdx >= 0 ? args[stageIdx + 1] : "dev";
  if (!STAGE_CONFIG[stage]) {
    console.error(`Unknown stage "${stage}". Use --stage dev|prod`);
    process.exit(1);
  }
  return { stage, dryRun: args.includes("--dry-run") };
}

function awsJson(args, profile) {
  const output = execFileSync(
    "aws",
    [...args, "--profile", profile, "--output", "json"],
    { encoding: "utf8" }
  );
  return JSON.parse(output);
}

function aws(args, profile) {
  execFileSync("aws", [...args, "--profile", profile], { stdio: "inherit" });
}

function findDistributionForDomain(domain, profile) {
  const { DistributionList } = awsJson(
    ["cloudfront", "list-distributions"],
    profile
  );
  const match = (DistributionList?.Items ?? []).find((item) =>
    (item.Aliases?.Items ?? []).includes(domain)
  );
  if (!match) {
    throw new Error(
      `No CloudFront distribution found for ${domain} (profile ${profile})`
    );
  }
  const policyId = match.DefaultCacheBehavior?.ResponseHeadersPolicyId;
  if (!policyId) {
    throw new Error(
      `Distribution ${match.Id} (${domain}) has no ResponseHeadersPolicyId`
    );
  }
  const arn = match.ARN;
  if (!arn) {
    throw new Error(
      `Distribution ${match.Id} (${domain}) has no ARN (upgrade AWS CLI?)`
    );
  }
  return { distributionId: match.Id, policyId, domain, distributionArn: arn };
}

function ensureDistributionCostTags(distributionArn, stage, profile, dryRun) {
  const desired = apCostAllocationTagItems(stage);
  const { Tags } = awsJson(
    ["cloudfront", "list-tags-for-resource", "--resource", distributionArn],
    profile
  );
  const existing = new Map(
    (Tags?.Items ?? []).map((t) => [t.Key, t.Value])
  );
  const needsUpdate = desired.some(
    (t) => existing.get(t.Key) !== t.Value
  );
  if (!needsUpdate) {
    return;
  }
  if (dryRun) {
    console.log(
      `Dry run — would tag ${distributionArn} with`,
      desired.map((t) => `${t.Key}=${t.Value}`).join(", ")
    );
    return;
  }
  const tagItems = desired
    .map((t) => `{Key=${t.Key},Value=${t.Value}}`)
    .join(",");
  aws(
    [
      "cloudfront",
      "tag-resource",
      "--resource",
      distributionArn,
      "--tags",
      `Items=[${tagItems}]`,
    ],
    profile
  );
  console.log(
    `Tagged CloudFront distribution (${desired.map((t) => `${t.Key}=${t.Value}`).join(", ")})`
  );
}

function securityHeadersForUpdate(existingSecurity, csp) {
  const updated = {
    ContentSecurityPolicy: {
      Override: true,
      ContentSecurityPolicy: csp,
    },
  };

  for (const [key, value] of Object.entries(existingSecurity ?? {})) {
    if (key === "ContentSecurityPolicy") continue;
    if (value?.Override != null) {
      updated[key] = value;
    }
  }

  return updated;
}

function buildUpdatedPolicyConfig(existing, csp) {
  const config = existing.ResponseHeadersPolicy.ResponseHeadersPolicyConfig;
  const updated = {
    Name: config.Name,
    Comment: config.Comment,
    CorsConfig: config.CorsConfig,
    SecurityHeadersConfig: securityHeadersForUpdate(
      config.SecurityHeadersConfig,
      csp
    ),
  };

  if (config.CustomHeadersConfig) {
    updated.CustomHeadersConfig = config.CustomHeadersConfig;
  }
  if (config.ServerTimingHeadersConfig) {
    updated.ServerTimingHeadersConfig = config.ServerTimingHeadersConfig;
  }
  if (config.RemoveHeadersConfig) {
    updated.RemoveHeadersConfig = config.RemoveHeadersConfig;
  }

  return updated;
}

function main() {
  const { stage, dryRun } = parseArgs();
  const { domain, profile } = STAGE_CONFIG[stage];
  const { distributionId, policyId, distributionArn } = findDistributionForDomain(
    domain,
    profile
  );
  ensureDistributionCostTags(distributionArn, stage, profile, dryRun);
  const existing = awsJson(
    ["cloudfront", "get-response-headers-policy", "--id", policyId],
    profile
  );
  const policyEtag = existing.ETag;
  const updatedConfig = buildUpdatedPolicyConfig(
    existing,
    CONTENT_SECURITY_POLICY
  );
  const currentCsp =
    existing.ResponseHeadersPolicy?.ResponseHeadersPolicyConfig
      ?.SecurityHeadersConfig?.ContentSecurityPolicy?.ContentSecurityPolicy;

  if (currentCsp === CONTENT_SECURITY_POLICY) {
    console.log(
      `CloudFront CSP already up to date for ${domain} (distribution ${distributionId}, policy ${policyId})`
    );
    return;
  }

  console.log(
    `Updating CloudFront CSP for ${domain} (distribution ${distributionId}, policy ${policyId})`
  );
  if (dryRun) {
    console.log("Dry run — new policy:\n", CONTENT_SECURITY_POLICY);
    return;
  }

  const configPath = join(
    tmpdir(),
    `apfront-csp-${stage}-${Date.now()}.json`
  );
  writeFileSync(configPath, JSON.stringify(updatedConfig));
  try {
    aws(
      [
        "cloudfront",
        "update-response-headers-policy",
        "--id",
        policyId,
        "--if-match",
        policyEtag,
        "--response-headers-policy-config",
        `file://${configPath}`,
      ],
      profile
    );
    console.log(`CloudFront CSP updated for ${domain}`);
  } finally {
    unlinkSync(configPath);
  }
}

main();
