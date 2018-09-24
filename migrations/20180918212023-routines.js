'use strict';

const table = "routines";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(table, {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ownerId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "users",
          key: "id"
        },
        onDelete: "cascade"
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      lastUsed: {
        allowNull: false,
        type: Sequelize.DATE
      }
    }).then(function() {
      return queryInterface.addIndex(table, ["lastUsed"], {indexName: "lastUsedIndex"});
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable(table);
  }
};