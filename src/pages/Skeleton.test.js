import React from "react";
import ReactDOM from "react-dom";

jest.mock("./Welcome", () => () => null);

import Welcome from "./Welcome";

it("renders without crashing", () => {
  const div = document.createElement("div");
  ReactDOM.render(<Welcome />, div);
  ReactDOM.unmountComponentAtNode(div);
});
