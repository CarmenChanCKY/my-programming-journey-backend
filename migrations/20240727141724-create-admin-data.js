"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("admin_data", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
        unique: true,
      },
      email: {
        allowNull: false,
        type: Sequelize.STRING(80),
        validate: {
          isEmail: true,
        },
        unique: true,
      },
      password: {
        allowNull: false,
        type: Sequelize.STRING(256),
      },
      salt: {
        allowNull: false,
        type: Sequelize.STRING(80),
      },
      token: {
        allowNull: false,
        type: Sequelize.STRING(80),
        defaultValue: "",
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
    await queryInterface.dropTable("admin_data");
  },
};
