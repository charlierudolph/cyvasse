import { Vector2d } from "konva/types/types";
import { ICard } from "../../shared/dtos/card";
import {
  doesHaveValue,
  valueOrDefault,
} from "../../shared/utilities/value_checker";
import cardImages from "../../data/card_images";
import { Stage as KonvaStage } from "konva/lib/Stage";
import { Layer as KonvaLayer } from "konva/lib/Layer";
import { Rect as KonvaRect } from "konva/lib/shapes/Rect";
import { Text as KonvaText } from "konva/lib/shapes/Text";
import { Easings as KonvaEasings, Tween as KonvaTween } from "konva/lib/Tween";
import Konva from "konva";
import { GameState, IGame, IPlayerState, ITrickEvent } from "src/app/shared/dtos/oh_heck/game";

export interface ITableOptions {
  element: HTMLDivElement;
}

interface IPosition {
  x: number;
  y: number;
}

interface ISize {
  width: number;
  height: number;
}

interface ICardDisplayInputs {
  cardSpacer: number;
  cardSize: ISize;
  padding: number;
  playerSize: ISize;
  playerOffset: IPosition;
}

interface IPlayerDisplayData {
  textPosition: IPosition;
  textWidth: number;
  borderPosition: IPosition;
  borderSize: ISize;
  cardPositions: ICardDisplayData[];
}

interface ICardDisplayData {
  size: ISize;
  rotation: number;
  position: IPosition;
  offset: IPosition;
}

interface IUserData {
  userId: number;
  positionIndex: number;
  cardsInHand: Konva.Rect[];
  playedCard: null | Konva.Rect;
  name: KonvaText;
  border: KonvaRect;
}

export function areCardsEqual(a: ICard, b: ICard): boolean {
  if (valueOrDefault(a.isJoker, false)) {
    return valueOrDefault(b.isJoker, false) && a.jokerNumber === b.jokerNumber;
  }
  return a.rank === b.rank && a.suit === b.suit;
}

const CARD_BACK_DEFAULT_STROKE = 2;
const CARD_BACK_HOVER_STROKE = 5;
const CARD_FACE_DEFAULT_STROKE = 0;
const CARD_FACE_HOVER_STORKE = 5;
const CARD_FACE_SELECTED_STROKE = 3;

export class OhHeckTable {
  private readonly container: HTMLDivElement;
  private readonly stage: KonvaStage;
  private readonly cardsLayer: KonvaLayer;
  private cardHeight: number;
  private cardWidth: number;
  private cardBackImage: HTMLImageElement;
  private users: Map<number, IUserData>;
  private currentUserId: number | null;
  private messageText: KonvaText;
  private readonly onPlayCard: (card: ICard) => void;
  private readonly onRearrangeCards: (cards: ICard[]) => void;

  constructor(
    options: ITableOptions,
    onPlayCard: (card: ICard) => void,
    onRearrangeCards: (cards: ICard[]) => void
  ) {
    this.container = options.element;
    this.onPlayCard = onPlayCard;
    this.onRearrangeCards = onRearrangeCards;
    this.stage = new KonvaStage({
      container: this.container,
      height: this.container.offsetHeight,
      width: this.container.offsetWidth,
    });
    this.cardsLayer = new KonvaLayer();
    this.stage.add(this.cardsLayer);
    this.computeCardSize();
  }

  private currentUserDragEndCard(draggedCardRect: Konva.Rect): void {
    if (this.currentUserId == null) {
      throw new Error("Current user required");
    }
    const userData = this.users.get(this.currentUserId);
    if (userData == null) {
      throw new Error("User not found");
    }
    const index = userData.cardsInHand.findIndex((x) => x === draggedCardRect);
    const positionalData = this.getPlayerPositionData(
      userData,
      this.users.size
    );
    const cardRect = userData.cardsInHand[index];
    const cardPosition = positionalData.cardPositions[index];
    this.updateCardSizeAndPosition(cardRect, cardPosition, false);
    const updatedCards: ICard[] = userData.cardsInHand.map((x) =>
      x.getAttr("yanivCard")
    );
    this.onRearrangeCards(updatedCards);
  }

  private currentUserDragMoveCard(draggedCardRect: Konva.Rect): void {
    if (this.currentUserId == null) {
      throw new Error("Current user required");
    }
    const userData = this.users.get(this.currentUserId);
    if (userData == null) {
      throw new Error("User not found");
    }
    const draggedCardOldIndex = userData.cardsInHand.findIndex(
      (x) => x === draggedCardRect
    );
    let draggedCardNewIndex = draggedCardOldIndex;
    for (let index = 0; index < userData.cardsInHand.length; index++) {
      const cardRect = userData.cardsInHand[index];
      if (cardRect !== draggedCardRect) {
        const cardCenter = draggedCardRect.x() + draggedCardRect.width() / 2;
        if (
          cardCenter > cardRect.x() &&
          cardCenter <= cardRect.x() + cardRect.width()
        ) {
          draggedCardNewIndex = index;
        }
      }
    }
    if (draggedCardOldIndex !== draggedCardNewIndex) {
      userData.cardsInHand.splice(
        draggedCardNewIndex,
        0,
        userData.cardsInHand.splice(draggedCardOldIndex, 1)[0]
      );
      const positionalData = this.getPlayerPositionData(
        userData,
        this.users.size
      );
      for (let index = 0; index < userData.cardsInHand.length; index++) {
        const cardRect = userData.cardsInHand[index];
        if (cardRect !== draggedCardRect) {
          const cardPosition = positionalData.cardPositions[index];
          this.updateCardSizeAndPosition(cardRect, cardPosition, false);
        }
      }
    }
  }

  private computeCardSize(): void {
    const min = Math.min(
      this.container.offsetHeight,
      this.container.offsetWidth
    );
    this.cardHeight = min / 6;
    this.cardWidth = (this.cardHeight * 2.5) / 3.5;
  }

  async initializeState(game: IGame, currentUserId?: number): Promise<void> {
    this.users = new Map<number, IUserData>();
    this.currentUserId = currentUserId ?? null;
    this.cardsLayer.destroyChildren();
    const promises: Array<Promise<any>> = [];
    if (game.playerStates[0].numberOfCards !== 0) {
      promises.push(this.initializePlayers(game));
    }
    await Promise.all(promises);
    if (game.state === GameState.BETTING || game.state == GameState.TRICK_ACTIVE || game.state == GameState.TRICK_COMPLETE || game.state == GameState.ROUND_COMPLETE) {
      this.updateActionTo(game.actionToUserId);
    }
    this.resize();
  }

  clear(): void {
    this.cardsLayer.destroyChildren();
    this.cardsLayer.draw();
  }

  async updateStateWithUserAction(
    trickEvent: ITrickEvent,
  ): Promise<void> {
    const userData = this.users.get(trickEvent.cardPlayed.userId);
    if (userData == null) {
      throw new Error("User not found");
    }
    // Animate card from users hand to player card position
    // If trick over, add message of who takes the trick, increment tricks taken
    const positionalData = this.getPlayerPositionData(
      userData,
      this.users.size
    );
    for (let index = 0; index < userData.cardsInHand.length; index++) {
      const cardRect = userData.cardsInHand[index];
      const cardPosition = positionalData.cardPositions[index];
      this.updateCardSizeAndPosition(
        cardRect,
        cardPosition,
        true
      );
    }
    this.updateActionTo(trickEvent.actionToUserId);
    this.cardsLayer.draw();
  }

  updateActionTo(actionToUserId: number): void {
    this.users.forEach((userData) => {
      userData.border.strokeWidth(0);
    });
    const userData = this.users.get(actionToUserId);
    if (userData == null) {
      throw new Error("User not found");
    }
    userData.border.strokeWidth(5);
  }

  resize(): void {
    this.stage.size({
      height: this.container.offsetHeight,
      width: this.container.offsetWidth,
    });
    this.computeCardSize();

    if (this.messageText != null) {
      this.messageText.x(
        this.container.offsetWidth / 2 - this.messageText.width() / 2
      );
      this.messageText.y(
        this.container.offsetHeight / 2 - this.messageText.height() / 2
      );
    }

    this.users.forEach((userData) => {
      const positionalData = this.getPlayerPositionData(
        userData,
        this.users.size
      );

      // reposition played card

      for (let index = 0; index < userData.cardsInHand.length; index++) {
        const cardRect = userData.cardsInHand[index];
        const cardPosition = positionalData.cardPositions[index];
        this.updateCardSizeAndPosition(cardRect, cardPosition, false);

        if (userData.userId === this.currentUserId) {
          cardRect.dragBoundFunc(
            (pos: IPosition): IPosition => {
              const minX = positionalData.borderPosition.x;
              const maxX =
                minX +
                positionalData.borderSize.width -
                cardPosition.size.width;
              return {
                x: pos.x < minX ? minX : pos.x > maxX ? maxX : pos.x,
                y: cardPosition.position.y,
              };
            }
          );
        }
      }

      userData.name.position(positionalData.textPosition);
      userData.name.width(positionalData.textWidth);
      userData.border.position(positionalData.borderPosition);
      userData.border.size(positionalData.borderSize);
    });

    this.cardsLayer.draw();
  }

  async initializePlayers(game: IGame): Promise<void> {
    let bottomIndex = 0;
    game.playerStates.forEach((playerState, index) => {
      if (playerState.userId === this.currentUserId) {
        bottomIndex = index;
      }
    });
    const promises: Array<Promise<any>> = [];
    for (let index = 0; index < game.playerStates.length; index++) {
      const positionIndex =
        (index - bottomIndex + game.playerStates.length) %
        game.playerStates.length;
      promises.push(
        this.initializePlayer(
          game.playerStates[index],
          positionIndex,
          game.state === GameState.ROUND_COMPLETE ||
            game.state === GameState.COMPLETE
        )
      );
    }
    await Promise.all(promises);
  }

  private getPlayerPositionData(
    userData: IUserData,
    numberOfPlayers: number
  ): IPlayerDisplayData {
    const sizingData = this.getPlayerSizingData(userData.userId);

    const tableXRadius = this.container.offsetWidth / 2;
    let position = {
      x: tableXRadius,
      y: this.container.offsetHeight - sizingData.playerSize.height / 2,
    };
    if (userData.positionIndex !== 0) {
      const tableOffset = sizingData.cardSize.height;
      const tableXRadius = this.container.offsetWidth / 2 - tableOffset;
      const tableYRadius = this.container.offsetHeight - 2 * tableOffset;
      let radians = (Math.PI * userData.positionIndex) / numberOfPlayers;
      if (numberOfPlayers >= 6) {
        radians =
          (Math.PI * (userData.positionIndex - 1)) / (numberOfPlayers - 2);
      }
      radians += Math.PI;
      position = {
        x: (Math.cos(radians) + 1) * tableXRadius + tableOffset,
        y: (Math.sin(radians) + 1) * tableYRadius + tableOffset,
      };
    }

    const cardPositions = userData.cardsInHand.map((_, index) =>
      this.getCardPositionalData(userData, position, sizingData, index)
    );
    return {
      textPosition: {
        x: position.x - sizingData.playerOffset.x,
        y:
          position.y +
          sizingData.padding -
          sizingData.playerOffset.y +
          sizingData.cardSize.height * 1.2,
      },
      textWidth: sizingData.playerSize.width,
      borderPosition: {
        x: position.x - sizingData.playerOffset.x,
        y: position.y - sizingData.playerOffset.y,
      },
      borderSize: sizingData.playerSize,
      cardPositions,
    };
  }

  private async initializePlayer(
    playerState: IPlayerState,
    positionIndex: number,
    displayRoundScore: boolean
  ): Promise<void> {
    const name = new KonvaText({
      align: "center",
      fontSize: 16,
      text: playerState.displayName,
    });
    this.cardsLayer.add(name);
    const border = new KonvaRect({
      stroke: "gray",
      strokeWidth: 0,
    });
    this.cardsLayer.add(border);
    const userData: IUserData = {
      userId: playerState.userId,
      positionIndex,
      cardsInHand: [],
      playedCard: null,
      name,
      border,
    };
    if (playerState.userId === this.currentUserId) {
      for (let index = 0; index < playerState.numberOfCards; index++) {
        const card = playerState.cards[index];
        const cardFace = await this.loadCardFace(card);
        this.initializeCurrentUserCardEventHandlers(cardFace);
        userData.cardsInHand.push(cardFace);
        this.cardsLayer.add(cardFace);
      }
    } else {
      const baseCardBack = await this.loadCardBack();
      for (let index = 0; index < playerState.numberOfCards; index++) {
        const cardRect = displayRoundScore
          ? await this.loadCardFace(playerState.cards[index])
          : baseCardBack.clone();
        userData.cardsInHand.push(cardRect);
        this.cardsLayer.add(cardRect);
      }
    }
    this.users.set(userData.userId, userData);
  }

  private getPlayerSizingData(userId: number): ICardDisplayInputs {
    const cardSize = { width: this.cardWidth, height: this.cardHeight };
    const cardSpacer =
      cardSize.width * (userId === this.currentUserId ? 1.2 : 0.33);
    const padding = userId === this.currentUserId ? 10 : 20;
    const height = cardSize.height * 1.2 + 16 + 2 * padding;
    const width = cardSize.width + 6 * cardSpacer + 2 * padding;
    return {
      cardSize,
      cardSpacer,
      padding,
      playerSize: {
        width,
        height,
      },
      playerOffset: {
        x: width / 2,
        y: height / 2,
      },
    };
  }

  private getDiscardPositionalData(
    cardIndex: number,
    numberOfCards: number
  ): ICardDisplayData {
    const center: IPosition = {
      x: this.container.offsetWidth / 2,
      y: this.container.offsetHeight / 2,
    };
    const partialCardHeight = this.cardHeight / 4;
    const initialCardY =
      center.y -
      this.cardHeight / 2 -
      (numberOfCards - 1) * 0.5 * partialCardHeight;
    return {
      size: {
        height: this.cardHeight,
        width: this.cardWidth,
      },
      position: {
        x: center.x + this.cardWidth * 0.1,
        y: initialCardY + cardIndex * partialCardHeight,
      },
      offset: { x: 0, y: 0 },
      rotation: 0,
    };
  }

  private getCardPositionalData(
    userData: IUserData,
    playerPosition: IPosition,
    sizingData: ICardDisplayInputs,
    cardIndex: number
  ): ICardDisplayData {
    const size = sizingData.cardSize;
    const cardOffset =
      (size.width +
        (userData.cardsInHand.length - 1) * sizingData.cardSpacer +
        2 * sizingData.padding) /
      2;
    const position: IPosition = {
      x:
        playerPosition.x +
        sizingData.padding +
        cardIndex * sizingData.cardSpacer -
        cardOffset,
      y: playerPosition.y + sizingData.padding - sizingData.playerOffset.y,
    };
    const offset: Vector2d = {
      x: 0,
      y: 0,
    };
    let rotation = 0;

    if (userData.userId !== this.currentUserId) {
      position.x += size.width / 2;
      position.y += size.height / 2;
      offset.x = size.width / 2;
      offset.y = size.height / 2;

      const rotateStep = 10;
      let rotateStart = 0;
      if (userData.cardsInHand.length % 2 === 0) {
        rotateStart =
          ((-1 * userData.cardsInHand.length) / 2) * rotateStep + rotateStep / 2;
      } else {
        rotateStart = ((-1 * (userData.cardsInHand.length - 1)) / 2) * rotateStep;
      }
      rotation = rotateStart + rotateStep * cardIndex;

      const centerIndex = (userData.cardsInHand.length - 1) / 2;
      const drop =
        (Math.floor(Math.abs(centerIndex - cardIndex)) * this.cardHeight) / 20;
      position.y += drop;
    }
    return {
      size,
      position,
      offset,
      rotation,
    };
  }

  private updateCardFaceStroke(rect: KonvaRect, hover: boolean): void {
    if (hover) {
      rect.stroke("black");
      rect.strokeWidth(CARD_FACE_HOVER_STORKE);
      return;
    }
    // const card = rect.getAttr("yanivCard");
    // if (
    //   doesHaveValue(card) &&
    //   this.currentUserSelectedDiscards.some((x) => areCardsEqual(x, card))
    // ) {
    //   rect.stroke("blue");
    //   rect.strokeWidth(CARD_FACE_SELECTED_STROKE);
    //   return;
    // }
    rect.stroke("black");
    rect.strokeWidth(CARD_FACE_DEFAULT_STROKE);
  }

  private removeCardEventHandlers(rect: KonvaRect): void {
    rect.off("mouseover");
    rect.off("mouseout");
    rect.off("click");
  }

  private initializeCurrentUserCardEventHandlers(rect: KonvaRect): void {
    this.removeCardEventHandlers(rect);
    rect.on("mouseover", (event) => {
      const rect = event.target as KonvaRect;
      this.updateCardFaceStroke(rect, true);
      this.cardsLayer.draw();
    });
    rect.on("mouseout", (event) => {
      const rect = event.target as KonvaRect;
      this.updateCardFaceStroke(rect, false);
      this.cardsLayer.draw();
    });
    // rect.on("click", (event) => {
    //   const rect = event.target as KonvaRect;
    //   this.currentUserClickCard(rect.getAttr("yanivCard"));
    // });
    rect.draggable(true);
    rect.on("dragstart", () => {
      rect.moveToTop();
      this.cardsLayer.draw();
    });
    rect.on("dragmove", () => {
      this.currentUserDragMoveCard(rect);
    });
    rect.on("dragend", () => {
      this.currentUserDragEndCard(rect);
    });
  }

  private async loadCardFace(card: ICard): Promise<KonvaRect> {
    const rect = new KonvaRect();
    rect.height(this.cardHeight);
    rect.width(this.cardWidth);
    await this.updateRectWithCardFace(rect, card);
    return rect;
  }

  private getCardImageBase64(card: ICard): string {
    if (valueOrDefault(card.isJoker, false)) {
      return cardImages.joker;
    }
    if (card.suit == null || card.rank == null) {
      throw new Error(
        `Card missing rank or suit when attempting to load image, card: ${JSON.stringify(
          card
        )}`
      );
    }
    return cardImages[`${card.suit.replace(/s$/, "")}_${card.rank}`];
  }

  private async loadCardBack(): Promise<KonvaRect> {
    const rect = new KonvaRect();
    rect.height(this.cardHeight);
    rect.width(this.cardWidth);
    await this.updateRectWithCardBack(rect);
    return rect;
  }

  private async updateRectWithCardBack(rect: KonvaRect): Promise<void> {
    if (this.cardBackImage == null) {
      this.cardBackImage = await new Promise<HTMLImageElement>((resolve) => {
        const image = new Image();
        image.src = `data:image/png;base64,${cardImages.back}`;
        image.onload = () => {
          resolve(image);
        };
      });
    }
    this.updateRectWithImage(rect, this.cardBackImage);
    rect.stroke("black");
    rect.strokeWidth(CARD_BACK_DEFAULT_STROKE);
  }

  private async updateRectWithCardFace(
    rect: KonvaRect,
    card: ICard
  ): Promise<void> {
    return await new Promise((resolve) => {
      const image = new Image();
      image.src = `data:image/png;base64,${this.getCardImageBase64(card)}`;
      image.onload = () => {
        rect.setAttr("yanivCard", card);
        this.updateRectWithImage(rect, image);
        rect.stroke("black");
        rect.strokeWidth(CARD_FACE_DEFAULT_STROKE);
        resolve();
      };
    });
  }

  private updateRectWithImage(rect: KonvaRect, image: HTMLImageElement): void {
    rect.fillPatternImage(image);
    rect.fillPatternRepeat("no-repeat");
    rect.fillPatternScale({
      x: rect.width() / image.width,
      y: rect.height() / image.height,
    });
  }

  private updateCardSizeAndPosition(
    rect: KonvaRect,
    displayData: ICardDisplayData,
    animate: boolean,
    onFinish: (() => void) | null = null
  ): void {
    rect.size(displayData.size);

    const image = rect.fillPatternImage();
    if (image != null) {
      rect.fillPatternScale({
        x: displayData.size.width / image.width,
        y: displayData.size.height / image.height,
      });
    }

    if (animate) {
      const tween = new KonvaTween({
        node: rect,
        duration: 1,
        easing: KonvaEasings.EaseInOut,
        onFinish,

        x: displayData.position.x,
        y: displayData.position.y,
        offsetX: displayData.offset.x,
        offsetY: displayData.offset.y,
        rotation: displayData.rotation,
      });
      tween.play();
    } else {
      rect.position(displayData.position);
      rect.offset(displayData.offset);
      rect.rotation(displayData.rotation);
    }
  }
}
