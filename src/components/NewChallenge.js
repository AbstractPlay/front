import React from 'react';
import graphql from 'babel-plugin-relay/macro';
import { QueryRenderer } from 'react-relay';
import { useTranslation } from 'react-i18next';
import { environment } from '../Environment';
import Spinner from './Spinner';

function NewChallenge(props) {
  const { t } = useTranslation();
  const setters = props.setters;
  const myid = props.id;

  return (
    <div>
      <label>{t("ChooseGame")}</label>
      <QueryRenderer
        environment={environment}
        query={graphql`
          query NewChallengeGamesQuery {
            gamesMeta {
                id,
                shortcode,
                name
            }
          }
        `}
        variables={{}}
        render={({error, props}) => {
          if (error) {
            return <div><p>{t('Error')}</p><p>{error.message}</p></div>;
          }
          if (!props) {
            return <Spinner />;
          }
          return (
            <select name="games" id="game_for_challenge" onChange={
              (e) => setters.challengeGameSetter(e.target.value)}>
              <option value="">--{t('Select')}--</option>
              {props.gamesMeta.map(item => { return <option key={item.id} value={item.shortcode}>{item.name}</option>})}
            </select>
          );
        }}
      />
      <label>{t("ChooseOpponent")}</label>
      <QueryRenderer
        environment={environment}
        query={graphql`
          query NewChallengeUsersQuery {
            users {
              id,
              name
            }
          }
        `}
        variables={{}}
        render={({error, props}) => {
          if (error) {
            return <div><p>{t('Error')}</p><p>{error.message}</p></div>;
          }
          if (!props) {
            return <Spinner />;
          }
          if (props.users == null || props.users === undefined || props.users.length === 0) {
            return <div><p>{t('NoUsers')}</p></div>;
          }
          else {
            return (
            <select name="users" id="user_for_challenge" onChange={(e) => setters.challengePlayerSetter(e.target.value)}>
              <option value="">--{t('Select')}--</option>
              {props.users
                .filter(user => user.id !== myid)
                .map(item => { return <option key={item.id} value={item.id}>{item.name}</option>})}
            </select>
            );
          }
        }}
      />
    </div>
  );
}

export default NewChallenge;
