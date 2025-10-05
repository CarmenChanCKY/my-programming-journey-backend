'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class google_oauth_tokens extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  google_oauth_tokens.init({
    client_id: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'google_oauth_tokens',
  });
  return google_oauth_tokens;
};