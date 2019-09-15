require("firebase-admin").initializeApp();
exports.new_user_callback = require("./src/new_user.js").new_user_callback;
exports.delete_user_callback = require("./src/delete_user.js").delete_user_callback;
exports.project_file_storage_delete_callback = require("./src/project_file_storage_delete.js").project_file_storage_delete_callback;
