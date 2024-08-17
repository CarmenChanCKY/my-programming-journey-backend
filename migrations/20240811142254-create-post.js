"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("post", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
        unique: true,
      },
      title: {
        allowNull: false,
        type: Sequelize.STRING(200),
        unique: true,
      },
      date: {
        allowNull: false,
        type: Sequelize.STRING(20),
      },
      content: {
        allowNull: false,
        type: Sequelize.TEXT("long"),
      },
      slug: {
        allowNull: false,
        type: Sequelize.STRING(256),
        unique: true,
      },
      category_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      meta_description: {
        allowNull: false,
        type: Sequelize.STRING(400),
        defaultValue: "",
      },
      meta_keyword: {
        allowNull: false,
        type: Sequelize.STRING(300),
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

    await queryInterface.addIndex("post", {
      fields: ["title"],
      name: "search_title",
      type: "FULLTEXT",
    });

    await queryInterface.addIndex("post", {
      fields: ["content"],
      name: "search_content",
      type: "FULLTEXT",
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("post");
  },
};
