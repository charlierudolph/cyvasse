import {
  createTestVariant,
  createTestUser,
  createTestCredentials,
  resetDatabaseBeforeEach,
  IUserCredentials,
  loginTestUser,
  createAndLoginTestUser,
} from "../../test/test_helper";
import { createExpressApp } from ".";
import { describe, it } from "mocha";
import HttpStatus from "http-status-codes";
import { GameDataService } from "../services/data/game_data_service";
import { GameService } from "../services/game_service";
import { PieceType } from "../shared/dtos/piece_rule";
import { expect } from "chai";
import {
  IGame,
  PlayerColor,
  IGameSetupChange,
  Action,
  IGamePly,
} from "../shared/dtos/game";

describe("GameRoutes", () => {
  resetDatabaseBeforeEach();
  const app = createExpressApp({
    corsOrigins: [],
    sessionCookieSecure: false,
    sessionSecret: "test",
  });
  let user1Credentials: IUserCredentials;
  let user1Id: number;
  let user2Credentials: IUserCredentials;
  let user2Id: number;
  let variantId: number;

  beforeEach(async () => {
    user1Credentials = createTestCredentials("user1");
    user1Id = await createTestUser(user1Credentials);
    user2Credentials = createTestCredentials("user2");
    user2Id = await createTestUser(user2Credentials);
    variantId = await createTestVariant(user1Id);
  });

  describe("get game (GET /api/games/:gameId)", () => {
    it("if not found, returns Not Found", async () => {
      // Arrange
      const agent = await loginTestUser(app, user1Credentials);

      // Act
      await agent.get(`/api/games/999`).expect(HttpStatus.NOT_FOUND);

      // Assert
    });

    describe("in setup", () => {
      let gameId: number;

      beforeEach(async () => {
        gameId = (
          await new GameDataService().createGame({
            variantId,
            alabasterUserId: user1Id,
            onyxUserId: user2Id,
          })
        ).gameId;
        await new GameService().updateGameSetup(user1Id, gameId, {
          pieceChange: {
            pieceTypeId: PieceType.KING,
            to: { x: 0, y: -1 },
          },
        });
        await new GameService().updateGameSetup(user2Id, gameId, {
          pieceChange: {
            pieceTypeId: PieceType.KING,
            to: { x: 0, y: 1 },
          },
        });
      });

      it("on success for alabaster user, returns only the alabaster setup", async () => {
        // Arrange
        const agent = await loginTestUser(app, user1Credentials);

        // Act
        const response = await agent
          .get(`/api/games/${gameId}`)
          .expect(HttpStatus.OK);

        // Assert
        expect(response.body).to.exist();
        const game: IGame = response.body;
        expect(game.alabasterSetupCoordinateMap).to.eql([
          {
            key: { x: 0, y: -1 },
            value: {
              piece: {
                pieceTypeId: PieceType.KING,
                playerColor: PlayerColor.ALABASTER,
              },
            },
          },
        ]);
        expect(game.onyxSetupCoordinateMap).to.eql([]);
      });

      it("on success for onyx user, returns only the onyx setup", async () => {
        // Arrange
        const agent = await loginTestUser(app, user2Credentials);

        // Act
        const response = await agent
          .get(`/api/games/${gameId}`)
          .expect(HttpStatus.OK);

        // Assert
        expect(response.body).to.exist();
        const game: IGame = response.body;
        expect(game.alabasterSetupCoordinateMap).to.eql([]);
        expect(game.onyxSetupCoordinateMap).to.eql([
          {
            key: { x: 0, y: 1 },
            value: {
              piece: {
                pieceTypeId: PieceType.KING,
                playerColor: PlayerColor.ONYX,
              },
            },
          },
        ]);
      });

      it("on success for spectator, returns no setup", async () => {
        // Arrange
        const { agent } = await createAndLoginTestUser(app, "user3");

        // Act
        const response = await agent
          .get(`/api/games/${gameId}`)
          .expect(HttpStatus.OK);

        // Assert
        expect(response.body).to.exist();
        const game: IGame = response.body;
        expect(game.alabasterSetupCoordinateMap).to.eql([]);
        expect(game.onyxSetupCoordinateMap).to.eql([]);
      });
    });
  });

  describe("update game setup (POST /api/games/:gameId/updateSetup)", () => {
    it("if not found, returns Not Found", async () => {
      // Arrange
      const agent = await loginTestUser(app, user1Credentials);

      // Act
      await agent
        .post(`/api/games/999/updateSetup`)
        .expect(HttpStatus.NOT_FOUND);

      // Assert
    });

    describe("in setup", () => {
      let gameId: number;

      beforeEach(async () => {
        gameId = (
          await new GameDataService().createGame({
            variantId,
            alabasterUserId: user1Id,
            onyxUserId: user2Id,
          })
        ).gameId;
      });

      it("on success for alabaster user, updates", async () => {
        // Arrange
        const agent = await loginTestUser(app, user1Credentials);
        const request: IGameSetupChange = {
          pieceChange: {
            pieceTypeId: PieceType.KING,
            to: { x: 0, y: -1 },
          },
        };

        // Act
        await agent
          .post(`/api/games/${gameId}/updateSetup`)
          .send(request)
          .expect(HttpStatus.OK);

        // Assert
        const updatedGame = await new GameDataService().getGame(gameId);
        expect(updatedGame.alabasterSetupCoordinateMap).to.eql([
          {
            key: { x: 0, y: -1 },
            value: {
              piece: {
                pieceTypeId: PieceType.KING,
                playerColor: PlayerColor.ALABASTER,
              },
            },
          },
        ]);
      });
    });
  });

  describe("complete game setup (POST /api/games/:gameId/completeSetup)", () => {
    it("if not found, returns Not Found", async () => {
      // Arrange
      const agent = await loginTestUser(app, user1Credentials);

      // Act
      await agent
        .post(`/api/games/999/completeSetup`)
        .expect(HttpStatus.NOT_FOUND);

      // Assert
    });

    describe("in setup, neither player completed", () => {
      let gameId: number;

      beforeEach(async () => {
        gameId = (
          await new GameDataService().createGame({
            variantId,
            alabasterUserId: user1Id,
            onyxUserId: user2Id,
          })
        ).gameId;
        await new GameService().updateGameSetup(user1Id, gameId, {
          pieceChange: {
            pieceTypeId: PieceType.KING,
            to: { x: 0, y: -1 },
          },
        });
      });

      it("on success, updates state", async () => {
        // Arrange
        const agent = await loginTestUser(app, user1Credentials);

        // Act
        await agent
          .post(`/api/games/${gameId}/completeSetup`)
          .expect(HttpStatus.OK);

        // Assert
        const updatedGame = await new GameDataService().getGame(gameId);
        expect(updatedGame.action).to.eql(Action.SETUP);
        expect(updatedGame.actionTo).to.eql(PlayerColor.ONYX);
      });
    });

    describe("in setup, other player completed", () => {
      let gameId: number;

      beforeEach(async () => {
        gameId = (
          await new GameDataService().createGame({
            variantId,
            alabasterUserId: user1Id,
            onyxUserId: user2Id,
          })
        ).gameId;
        await new GameService().updateGameSetup(user1Id, gameId, {
          pieceChange: {
            pieceTypeId: PieceType.KING,
            to: { x: 0, y: -1 },
          },
        });
        await new GameService().updateGameSetup(user2Id, gameId, {
          pieceChange: {
            pieceTypeId: PieceType.KING,
            to: { x: 0, y: 1 },
          },
        });
        await new GameService().completeGameSetup(user2Id, gameId);
      });

      it("on success, updates state", async () => {
        // Arrange
        const agent = await loginTestUser(app, user1Credentials);

        // Act
        await agent
          .post(`/api/games/${gameId}/completeSetup`)
          .expect(HttpStatus.OK);

        // Assert
        const updatedGame = await new GameDataService().getGame(gameId);
        expect(updatedGame.action).to.eql(Action.PLAY);
        expect(updatedGame.actionTo).to.eql(PlayerColor.ALABASTER);
        expect(updatedGame.currentCoordinateMap).to.eql([
          {
            key: { x: 0, y: -1 },
            value: {
              piece: {
                pieceTypeId: PieceType.KING,
                playerColor: PlayerColor.ALABASTER,
              },
            },
          },
          {
            key: { x: 0, y: 1 },
            value: {
              piece: {
                pieceTypeId: PieceType.KING,
                playerColor: PlayerColor.ONYX,
              },
            },
          },
        ]);
      });
    });
  });

  describe("create game ply (POST /api/games/:gameId/createPly)", () => {
    it("if not found, returns Not Found", async () => {
      // Arrange
      const agent = await loginTestUser(app, user1Credentials);

      // Act
      await agent.post(`/api/games/999/createPly`).expect(HttpStatus.NOT_FOUND);

      // Assert
    });

    describe("in play, ply does not cause game to end", () => {
      let gameId: number;

      beforeEach(async () => {
        gameId = (
          await new GameDataService().createGame({
            variantId,
            alabasterUserId: user1Id,
            onyxUserId: user2Id,
          })
        ).gameId;
        await new GameService().updateGameSetup(user1Id, gameId, {
          pieceChange: {
            pieceTypeId: PieceType.KING,
            to: { x: 0, y: -1 },
          },
        });
        await new GameService().updateGameSetup(user2Id, gameId, {
          pieceChange: {
            pieceTypeId: PieceType.KING,
            to: { x: 0, y: 1 },
          },
        });
        await new GameService().completeGameSetup(user1Id, gameId);
        await new GameService().completeGameSetup(user2Id, gameId);
      });

      it("on success, updates state", async () => {
        // Arrange
        const agent = await loginTestUser(app, user1Credentials);
        const request: IGamePly = {
          piece: {
            pieceTypeId: PieceType.KING,
            playerColor: PlayerColor.ALABASTER,
          },
          from: { x: 0, y: -1 },
          movement: {
            to: { x: 0, y: 0 },
          },
        };

        // Act
        await agent
          .post(`/api/games/${gameId}/createPly`)
          .send(request)
          .expect(HttpStatus.OK);

        // Assert
        const updatedGame = await new GameDataService().getGame(gameId);
        expect(updatedGame.action).to.eql(Action.PLAY);
        expect(updatedGame.actionTo).to.eql(PlayerColor.ONYX);
        expect(updatedGame.currentCoordinateMap).to.eql([
          {
            key: { x: 0, y: 0 },
            value: {
              piece: {
                pieceTypeId: PieceType.KING,
                playerColor: PlayerColor.ALABASTER,
              },
            },
          },
          {
            key: { x: 0, y: 1 },
            value: {
              piece: {
                pieceTypeId: PieceType.KING,
                playerColor: PlayerColor.ONYX,
              },
            },
          },
        ]);
        expect(updatedGame.plies).to.eql([request]);
      });
    });

    describe("in play, ply causes game to end", () => {
      let gameId: number;

      beforeEach(async () => {
        gameId = (
          await new GameDataService().createGame({
            variantId,
            alabasterUserId: user1Id,
            onyxUserId: user2Id,
          })
        ).gameId;
        await new GameService().updateGameSetup(user1Id, gameId, {
          pieceChange: {
            pieceTypeId: PieceType.KING,
            to: { x: 0, y: -1 },
          },
        });
        await new GameService().updateGameSetup(user2Id, gameId, {
          pieceChange: {
            pieceTypeId: PieceType.KING,
            to: { x: 0, y: 1 },
          },
        });
        await new GameService().completeGameSetup(user1Id, gameId);
        await new GameService().completeGameSetup(user2Id, gameId);
        await new GameService().createGamePly(user1Id, gameId, {
          piece: {
            pieceTypeId: PieceType.KING,
            playerColor: PlayerColor.ALABASTER,
          },
          from: { x: 0, y: -1 },
          movement: {
            to: { x: 0, y: 0 },
          },
        });
      });

      it("on success, updates state", async () => {
        // Arrange
        const agent = await loginTestUser(app, user2Credentials);
        const request: IGamePly = {
          piece: { pieceTypeId: PieceType.KING, playerColor: PlayerColor.ONYX },
          from: { x: 0, y: 1 },
          movement: {
            to: { x: 0, y: 0 },
            capturedPiece: {
              pieceTypeId: PieceType.KING,
              playerColor: PlayerColor.ALABASTER,
            },
          },
        };

        // Act
        await agent
          .post(`/api/games/${gameId}/createPly`)
          .send(request)
          .expect(HttpStatus.OK);

        // Assert
        const updatedGame = await new GameDataService().getGame(gameId);
        expect(updatedGame.action).to.eql(Action.COMPLETE);
        expect(updatedGame.actionTo).to.eql(PlayerColor.ALABASTER);
        expect(updatedGame.currentCoordinateMap).to.eql([
          {
            key: { x: 0, y: 0 },
            value: {
              piece: {
                pieceTypeId: PieceType.KING,
                playerColor: PlayerColor.ONYX,
              },
            },
          },
        ]);
        expect(updatedGame.plies).to.eql([
          {
            piece: {
              pieceTypeId: PieceType.KING,
              playerColor: PlayerColor.ALABASTER,
            },
            from: { x: 0, y: -1 },
            movement: {
              to: { x: 0, y: 0 },
            },
          },
          request,
        ]);
      });
    });
  });
});