'use strict';

const table = "workoutExercises";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(table, {
      exerciseId: { primaryKey: true, type: Sequelize.INTEGER,
      references: {
        model: "exercises",
        key: "id"
      },
      onDelete: "cascade" 
      },
      workoutId: { primaryKey: true, type: Sequelize.INTEGER,
        references: {
          model: "workouts",
          key: "id"
        },
        onDelete: "cascade" },
      sets: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      reps: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      order: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    }).then(function() {
      return queryInterface.addIndex(table, ["order"], {indexName: "exerciseOrderIndex"});
    });
  },
  down: (queryInterface, Sequelize) => {
   return queryInterface.dropTable(table);
  }
};
