import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AccountForgotPassword from "./AccountForgotPassword";
import AccountForgotUsername from "./AccountForgotUsername";
import AccountLogin from "./AccountLogin";
import AccountRegister from "./AccountRegister";
import AccountResetPassword from "./AccountResetPassword";
import AccountVerify from "./AccountVerify";
import AccountConfirmEmail from "./AccountConfirmEmail";
import AccountUnsubscribeEmail from "./AccountUnsubscribeEmail";

export default function AccountRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="login" replace />} />
      <Route path="login" element={<AccountLogin />} />
      <Route path="register" element={<AccountRegister />} />
      <Route path="verify" element={<AccountVerify />} />
      <Route path="forgot-password" element={<AccountForgotPassword />} />
      <Route path="reset-password" element={<AccountResetPassword />} />
      <Route path="forgot-username" element={<AccountForgotUsername />} />
      <Route path="confirm-email" element={<AccountConfirmEmail />} />
      <Route path="unsubscribe-email" element={<AccountUnsubscribeEmail />} />
      <Route path="*" element={<Navigate to="login" replace />} />
    </Routes>
  );
}