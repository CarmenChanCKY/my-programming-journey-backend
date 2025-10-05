"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("google_oauth_tokens", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      client_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      refresh_token: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      refresh_iv: {
        type: Sequelize.TEXT,
      },
      refresh_tag: {
        type: Sequelize.TEXT,
      },
      access_token: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      access_iv: {
        type: Sequelize.TEXT,
      },
      access_tag: {
        type: Sequelize.TEXT,
      },
      scope: {
        type: Sequelize.TEXT,
      },
      token_type: {
        type: Sequelize.TEXT,
      },
      expires_at: {
        type: Sequelize.STRING,
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
    await queryInterface.dropTable("google_oauth_tokens");
  },
};
