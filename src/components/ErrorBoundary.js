import React from "react";
import PropTypes from "prop-types";
import FatalError from "./FatalError";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    const { error } = this.state;
    const { children, inline = false } = this.props;

    if (error) {
      return <FatalError error={error} inline={inline} />;
    }

    return children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  inline: PropTypes.bool,
};

export default ErrorBoundary;
