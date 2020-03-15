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

exports.createList =  async (idBoard, tasks, token, key, conditions) => {
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
            //Change task by the listId
            conditions.forEach(condition => {
                condition.branch.forEach((item => {
                    if (item.task === task.id) {
                        item.task = resp.data.id;
                    }
                }))
            })
        })
        .catch(error => {
            return (error.message + ' ( ' + error.response.statusText + ' ) : ' + error.response.data);
        })
        if (error) return(Error(error));
    };
    return(conditions);
}

exports.createConditions = async (idBoard, conditions, token, key) => {
    return getFirstList(idBoard, token, key)
    .then((idList) => {
        nameCard = 'Conditions_Data_Storage';
        return createCard(idList, nameCard, token, key)
        .then((idCard) => {
            return createComment(idCard, conditions, token, key)
            .then((data) => {
                console.log("Comment created");
            })
            .catch((error) => {
                return error;
            });
        })
        .catch((error) => {
            return error;
        });
    })
    .catch((error) => {
        return error;
    });
}

getFirstList = async (idBoard, token, key) => {
    const data = {
        params: {
            token,
            key
        }
    }
    return requestTrello.get('/boards/' + idBoard + '/lists', data)
    .then((resp) => {
        return idList = resp.data.find(list =>  list.pos===1).id;
    })
    .catch(error => {
        return (error.message + ' ( ' + error.response.statusText + ' ) : ' + error.response.data);
    })
}

createCard = async (idList, nameCard, token, key) => {
    const data = {
        name: nameCard,
        idList,
        token,
        key
    }
    return requestTrello.post('/cards', data)
    .then(resp => {
        console.log("Card : " + nameCard + " created");
        return resp.data.id;
      })
    .catch(error => {
        return (error.message + ' ( ' + error.response.statusText + ' ) : ' + error.response.data);
    })
}

createComment = async (idCard, conditions, token, key) => {
    var content = '';

    conditions.forEach(element => {
        content += element.name + ':';
        element.branch.forEach((item) => {
            content += item.task + '=' + item.nameCondition + '/';
        })
        content += '\n';
    });
    const data = {
        text: content,
        token,
        key
    }
    return requestTrello.post('/cards/' + idCard + '/actions/comments', data)
    .then(resp => {
        console.log("Comment created.");
        return resp.data.id;
      })
    .catch(error => {
        console.log(error);
        return (error.message + ' ( ' + error.response.statusText + ' ) : ' + error.response.data);
    })
}