import React from 'reactn';
import NewProfileMutation from './NewProfileMutation';
import Button from 'react-bootstrap/Button';

class NewChallenge extends React.Component {
  constructor(props) {
    super(props);
  }

  state = {
    name: "",
    consent: false,
    anonymous: false,
    country: "",
    tagline: "",
    error: false,
    errorMessage: ""
  }

  setError = (message) => {
    this.setState({ error: true, errorMessage: message });
  }

  handleInputChange = (event) => {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  }

  render() {
    if (! this.state.error) {
      return (
        <div>
          <form>
            <label>
              Your desired display name. It must be unique across names currently in use and those recently used.
              <input name="name" type="text" value={this.state.name} onChange={this.handleInputChange} />
            </label>
            <label>
              2 Character Country code of where you want to tell people you're from
              <input name="country" type="text" value={this.state.country} onChange={this.handleInputChange} />
            </label>
            <label>
            A free-form tagline (255 characters max)
              <input name="tagline" type="text" value={this.state.tagline} onChange={this.handleInputChange} />
            </label>
            <label>
              Would you like to be anonymous?
              <input name="anonymous" type="checkbox" checked={this.state.anonymous} onChange={this.handleInputChange} />
            </label>
            <label>
              Do you consent to the Abstract Play's terms of service and the privacy policy?
              <input name="consent" type="checkbox" checked={this.state.consent} onChange={this.handleInputChange} />
            </label>
          </form>
          <Button variant="primary" onClick={this.handleSubmit}>{"Submit!"}</Button>
        </div>
      );
    }
    else {
      return (<h4>{this.state.errorMessage}</h4>);
    }
  }

  handleSubmit = () => {
    const name = this.state.name;
    const consent = this.state.consent;
    const anonymous = this.state.anonymous;
    const country = this.state.country;
    const tagline = this.state.tagline;
    const { stateSetter } = this.props;
    NewProfileMutation(name, consent, anonymous, country, tagline,
      (response, errors) => {
        if (errors !== null && errors !== undefined && errors.length > 0) {
          this.setError(errors[0].message);
        }
        else {
          stateSetter({ mainState: "main" });
        }
      },
      this.setError);
  }
}

export default NewChallenge;
