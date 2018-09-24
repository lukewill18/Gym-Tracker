'use strict';

const table = "friendships";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(table, {
      user1ID: { primaryKey: true, type: Sequelize.INTEGER,
      references: {
        model: "users",
        key: "id"
      },
      onDelete: "cascade" 
      },
      user2ID: { primaryKey: true, type: Sequelize.INTEGER,
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
