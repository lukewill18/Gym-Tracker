'use strict';

const table = "workouts";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(table, {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      routineId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "routines",
          key: "id"
        },
        onDelete: "cascade"
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      order: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    }).then(function() {
      return queryInterface.addIndex(table, ["order"], {indexName: "workoutOrderIndex"});
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable(table);
  }
};
