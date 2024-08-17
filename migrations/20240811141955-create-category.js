"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("category", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
        unique: true,
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING(80),
      },
      data_status: {
        allowNull: false,
        isIn: [["active", "inactive"]],
        type: Sequelize.STRING(10),
        defaultValue: "active",
      },
      created_at: {
        allowNull: false,
        type: "timestamp DEFAULT CURRENT_TIMESTAMP",
        defaultValue: () => new Date(),
      },
      updated_at: {
        allowNull: false,
        type: "timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        defaultValue: () => new Date(),
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("category");
  },
};
