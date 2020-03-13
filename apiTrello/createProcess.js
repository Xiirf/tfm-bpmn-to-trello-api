const requestBase = require('./request');
require('dotenv').config();

var requestTrello = requestBase();

exports.createBoard = (nameBoard, teamName, token, key) => {
    const data = {
        name: nameBoard,
        defaultLists: false,
        idOrganization: teamName,
        prefs_permissionLevel: 'org',
        token,
        key
    }
    return requestTrello.post('/boards', data)
    .then(resp => {
        console.log("Board : " + nameBoard + " created");
        return resp.data.id;
      })
    .catch(error => {
        return (error.message + ' ( ' + error.response.statusText + ' ) : ' + error.response.data);
    })
}

exports.createList =  async (idBoard, tasks, token, key) => {
    for (task of tasks) {
        const data = {
            name: task.name,
            idBoard: idBoard,
            pos: task.pos,
            token,
            key
        }
        const error = await requestTrello.post('/lists', data)
        .then(resp => {
            console.log("List : " + task.name + " created");
        })
        .catch(error => {
            return (error.message + ' ( ' + error.response.statusText + ' ) : ' + error.response.data);
        })
        if (error) return(Error(error));
    };
    return('end');
}