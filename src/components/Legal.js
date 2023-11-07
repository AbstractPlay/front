import React, { Fragment, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { addResource } from "@abstractplay/gameslib";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

const md = `### Terms of Service

By signing up for an Abstract Play account, you agree to be bound by the following terms and conditions. Basically, it describes what we expect from the users. Direct any questions to [support@abstractplay.com](mailto:support@abstractplay.com).

#### Basic Terms

* You must be 13 years or older to use this service.
* You are responsible for any activity that occurs under your account.
* You are responsible for keeping your password secure.
* You must not abuse, harass, threaten, or intimidate other users.
* You may not use Abstract Play for any illegal or unauthorized purpose. You agree to comply with all local laws regarding online conduct and acceptable content.
* You are solely responsible for your conduct and any data, text, information, screen names, graphics, photos, profiles, audio and video clips, links, and other content that you submit, post, and display using Abstract Play services.
* You must not modify, adapt, or hack Abstract Play webpages or servers or modify another website so as to falsely imply that it is associated with Abstract Play.
* You must not create or submit unwanted email to any Abstract Play members.
* You must not transmit any worms or viruses or any code of a destructive nature.
* You must not, in the use of Abstract Play services, violate any laws in your jurisdiction (including copyright laws).

Violation of any of these agreements will result in the termination of your Abstract Play account. While Abstract Play prohibits such conduct and content on its site, you understand and agree that we cannot be responsible for the user content posted on its website and you nonetheless may be exposed to such materials. You use Abstract Play at your own risk.

#### General Conditions

* We reserve the right to modify or terminate Abstract Play for any reason, without notice, at any time.
* We reserve the right to alter these terms of service at any time. If the alterations constitute a material change, we will announce the change on the [Abstract Play website](https://www.abstractplay.com). What constitutes a "material change" will be determined at our sole discretion, in good faith, and using common sense and reasonable judgement.
* We reserve the right to refuse service to anyone for any reason at any time.
* We may, but have no obligation to, remove content (including forcibly changing display names) that we determine in our sole discretion is unlawful, offensive, threatening, libellous, defamatory, obscene, or otherwise objectionable or violates any party's intellectual property or these terms of service.

#### Summary

Be nice to the other users. Be nice to the hosting servers. And just have fun playing games!

### Privacy Policy

We are Internet users too, and we pledge to hold your information with the same respect we wish ours was. Any questions regarding the policy can be sent to [support@abstractplay.com](mailto:support@abstractplay.com).

#### Data Collection

* The only information we require to use this service is an arbitrary username and a functional email address.
* This server logs standard visitor information, including IP address, browser type, date/time of visit, page requested, etc...
* The system itself also logs certain specific pieces of information about your interactions with the system, including date/time of last login and games played.
* Much of the site is supported by Amazon Web Services. They also maintain their own privacy policy.

#### Cookies

This system does require that you enable "cookies." A cookie is a small file containing a string of characters that is sent to your computer when you visit a website. This cookie contains no sensitive information! It consists only of a session identifier so the system can tell who is logged on. Clicking the "logout" link will remove this cookie from your computer.

#### Information Sharing

The only private information we collect is your email address. We will never share that address with anyone outside of AWS Cognito, which we use to manage authentication.

However, your displayed username, record of games played, and in-game chats are publicly visible. You should avoid divulging any private information on this open channel.

You may request that the site administration remove or alter in-game chat messages in the on-site archives, and the administration will do what it can to accommodate the request (at their sole discretion). Abstract Play has no control, however, over these game records once they find their way into public aggregators or archives. You accept sole responsibility and liability for any private information exposed in this way.

#### Information Security

We use Amazon Web Services as the backend for Abstract Play. We have taken reasonable measures to protect against unauthorized access to or unauthorized alteration, disclosure, or destruction of data, but nothing is for certain. Use at your own risk.

#### Changes to this Policy
If this policy is changed, we will announce it on the [Abstract Play website](https://www.abstractplay.com).
`;

function About(props) {
  const { t, i18n } = useTranslation();
  addResource(i18n.language);

  useEffect(() => {
    addResource(i18n.language);
  }, [i18n.language]);

  return (
    <Fragment>
      <Helmet>
        <link rel="canonical" href="https://play.abstractplay.com/legal" />
      </Helmet>
      <article className="content">
        <h1 className="has-text-centered title">{t("Legal")}</h1>
        <ReactMarkdown rehypePlugins={[rehypeRaw]} className="content">
          {md}
        </ReactMarkdown>
      </article>
    </Fragment>
  );
}

export default About;
