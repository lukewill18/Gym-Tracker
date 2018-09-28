'use strict';

const table = "logs";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(table, {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "users",
          key: "id"
        },
        onDelete: "cascade" 
      },
      contestId: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: {
          model: "contests",
          key: "id"
        },
        onDelete: "cascade"
      },
      workoutId: { 
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "workouts",
          key: "id"
        },
        onDelete: "cascade" 
      },
      datetime: {
        allowNull: false,
        type: Sequelize.DATE
      } 
    }).then(function() {
      return queryInterface.addIndex(table, ["datetime"], {indexName: "logDateIndex"});
    });
  },
  down: (queryInterface, Sequelize) => {
   return queryInterface.dropTable(table);
  }
};
