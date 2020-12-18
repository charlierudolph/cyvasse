import { IPaginationRequest } from "../search";
import { ICard } from "./card";

export interface IPlayerState {
  userId: number;
  username: string;
  numberOfCards: number;
  cards: ICard[];
}

export enum RoundScoreType {
  DEFAULT = "default",
  YANIV = "yaniv",
  ASAF = "asaf",

  // Frontend only
  TOTAL = "total",
}

export interface IRoundScore {
  [userId: number]: IRoundPlayerScore;
}

export interface IRoundPlayerScore {
  score: number;
  scoreType: RoundScoreType;
}

export interface IRoundPlayerScoreWithCards extends IRoundPlayerScore {
  cards: ICard[];
}

export interface IGameOptions {
  playTo: number;
}

export enum GameState {
  PLAYERS_JOINING = "players_joining",
  ROUND_ACTIVE = "round_active",
  ROUND_COMPLETE = "round_complete",
  COMPLETE = "complete",
}

export interface IGame {
  gameId: number;
  hostUserId: number;
  options: IGameOptions;
  state: GameState;
  playerStates: IPlayerState[];
  roundScores: IRoundScore[];

  // Fields populated with state == ROUND_ACTIVE
  actionToUserId: number;
  cardsOnTopOfDiscardPile: ICard[];
}

export interface IGameActionRequest {
  callYaniv?: boolean;
  cardsDiscarded?: ICard[];
  cardPickedUp?: ICard;
}

export interface IGameActionResponse {
  cardPickedUpFromDeck?: ICard;
  actionToNextPlayerEvent?: IActionToNextPlayerEvent;
  roundFinishedEvent?: IRoundFinishedEvent;
}

export interface IPlayerJoinedEvent {
  playerStates: IPlayerState[];
}

export interface ILastAction {
  userId: number;
  cardsDiscarded: ICard[];
  cardPickedUp?: ICard;
}

export interface IActionToNextPlayerEvent {
  lastAction: ILastAction;
  actionToUserId: number;
}

export interface IRoundFinishedEvent {
  playerStates: IPlayerState[];
  roundScore: IRoundScore;
  updatedGameState: GameState;
}

export interface ISearchedGameUser {
  userId: number;
  username: string;
}

export interface ISearchedGame {
  gameId: number;
  hostUserId: number;
  state: GameState;
  players: ISearchedGameUser[];
  createdAt: string;
  updatedAt: string;
}

export interface ISearchGamesFilterRequest {
  includeCompleted: boolean;
}

export interface ISearchGamesRequest {
  filter: ISearchGamesFilterRequest;
  pagination: IPaginationRequest;
}
