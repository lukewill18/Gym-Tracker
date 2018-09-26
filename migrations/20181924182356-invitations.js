'use strict';

const table = "invitations";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(table, {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      inviterID: { allowNull: false, type: Sequelize.INTEGER,
        references: {
          model: "users",
          key: "id"
        },
        onDelete: "cascade" 
      },
      targetID: { allowNull: false, type: Sequelize.INTEGER,
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
      contestID: {
        type: Sequelize.INTEGER, allowNull: true, 
          references: {
            model: "contests",
            key: "id"
          },
          onDelete: "cascade"
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
