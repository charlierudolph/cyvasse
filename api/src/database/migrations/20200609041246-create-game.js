"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    // Matches shared/dtos/game:Action
    const actionEnum = Sequelize.ENUM("setup", "play", "complete");
    const userConfig = {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: {
          tableName: "Users",
        },
        key: "userId",
      },
    };
    return queryInterface.createTable("Games", {
      gameId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      variantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: "Variants",
          },
          key: "variantId",
        },
      },
      action: {
        type: actionEnum,
        allowNull: false,
      },
      actionToUserId: userConfig,
      alabasterUserId: userConfig,
      onyxUserId: userConfig,
      initialSetup: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      currentSetup: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      plies: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("Games");
  },
};