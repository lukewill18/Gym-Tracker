'use strict';

const table = "sets";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(table, {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      logId: { 
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "logs",
          key: "id"
        },
        onDelete: "cascade" 
      },
      exerciseId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "exercises",
          key: "id"
        },
        onDelete: "cascade"
      },
      reps: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      weight: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      order: {
        allowNull: false,
        type: Sequelize.INTEGER
      }
    }).then(function() {
      return queryInterface.addIndex(table, ["order"], {indexName: "setOrderIndex"});
    });
  },
  down: (queryInterface, Sequelize) => {
   return queryInterface.dropTable(table);
  }
};
