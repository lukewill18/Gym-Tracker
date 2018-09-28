'use strict';

const table = "contests";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(table, {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      routineID: { 
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "routines",
          key: "id"
        },
        onDelete: "cascade" 
      },/*
      workoutID: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: {
          model: "workouts",
          key: "id"
        },
        onDelete: "cascade" 
      },*/
      name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      type: {
        allowNull: false,
        type: Sequelize.STRING
      },
      start: {
        allowNull: true,
        type: Sequelize.DATE
      },
      end: {
        allowNull: true,
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    }).then(function() {
      return queryInterface.addIndex(table, ["createdAt"], {indexName: "contestCreatedAtIndex"});
    });
  },
  down: (queryInterface, Sequelize) => {
   return queryInterface.dropTable(table);
  }
};
