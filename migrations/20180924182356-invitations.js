'use strict';

const table = "invitations";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(table, {
      inviterID: { primaryKey: true, type: Sequelize.INTEGER,
        references: {
          model: "users",
          key: "id"
        },
        onDelete: "cascade" 
      },
      targetID: { primaryKey: true, type: Sequelize.INTEGER,
        references: {
          model: "users",
          key: "id"
        },
        onDelete: "cascade"
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false
      }
    }).then(function() {
      return queryInterface.addIndex(table, ["date"], {indexName: "invitationDateIndex"});
    });
  },
  down: (queryInterface, Sequelize) => {
   return queryInterface.dropTable(table);
  }
};
