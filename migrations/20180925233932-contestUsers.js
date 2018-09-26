'use strict';

const table = "contestUsers";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(table, {
      contestID: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        references: {
          model: "contests",
          key: "id"
        },
        onDelete: "cascade"
      },
      userID: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        references: {
          model: "users",
          key: "id"
        },
        onDelete: "cascade"
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable(table);
  }
};
