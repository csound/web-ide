require("firebase-admin").initializeApp();
exports.new_user_callback = require("./src/new_user.js").new_user_callback;
exports.delete_user_callback = require("./src/delete_user.js").delete_user_callback;
exports.project_file_storage_delete_callback = require("./src/project_file_storage_delete.js").project_file_storage_delete_callback;
exports.add_project_file_on_storage_upload_callback = require("./src/add_project_file_on_storage_upload.js").add_project_file_on_storage_upload_callback;
exports.projects_counter = require("./src/projects_counter.js").projects_counter;
exports.followers_counter = require("./src/followers_counter.js").followers_counter;
exports.following_counter = require("./src/following_counter.js").following_counter;
exports.host = require("./src/og_metadata_tags.js").host;
