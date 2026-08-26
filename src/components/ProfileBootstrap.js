import {
  useProfileBootstrap,
  useRefreshDataListener,
} from "../hooks/useProfileBootstrap";

export default function ProfileBootstrap() {
  useProfileBootstrap();
  useRefreshDataListener();
  return null;
}
