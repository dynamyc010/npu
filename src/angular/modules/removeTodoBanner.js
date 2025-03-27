const identifier = ["angular", "removeTodoBanner"]
const $ = window.jQuery;
const utils = require('../utils');

function getTodoList(){
    $.ajax("api/Dashboard/GetNumberOfTasksByType")
}

function shouldRemoveBanner(){

}

function init(){
    if(!shouldRemoveBanner()) return;


}



module.exports = {
    identifier: identifier.join("."),
    shouldActivate: () => utils.isLoggedIn(),
    initialize: () => {

    },
    // Do actions before destroying
    destroy: () => {},
};