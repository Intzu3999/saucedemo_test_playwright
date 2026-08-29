// @ts-check

const { BaseApi } = require('./BaseApi');
const { DummyJsonUsersApi } = require('./DummyJsonUsersApi');
const { DummyJsonCartsApi } = require('./DummyJsonCartsApi');
const schemas = require('./schemas');

module.exports = {
  BaseApi,
  DummyJsonUsersApi,
  DummyJsonCartsApi,
  schemas,
};
