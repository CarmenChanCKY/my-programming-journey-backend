"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      "post", // Target table name
      "hide_post", // New column name
      {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: 0, // 0 = false, 1 = true
      },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("post", "hide_post");
  },
};
