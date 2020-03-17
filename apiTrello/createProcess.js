const requestBase = require('./request');
require('dotenv').config();

var requestTrello = requestBase();

exports.createBoard = (nameBoard, teamName, token, key) => {
    return new Promise( (resolve, reject) => {
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
            resolve(resp.data.id);
          })
        .catch(error => {
            var err = {
                error: error.message + ' ( ' + error.response.statusText + ' )',
                status: error.response.status,
                msg: error.response.data
            }
            reject(err);
        });
    });
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
                if (condition.idTask === task.id) {
                    condition.idTask = resp.data.id;
                } else {
                    const index = condition.lastTask.indexOf(task.id);
                    if (index > -1) {
                        condition.lastTask.splice(index, 1);
                        condition.lastTask.push(resp.data.id);
                    }
                }
            })
        })
        .catch(error => {
            var err = {
                error: error.message + ' ( ' + error.response.statusText + ' )',
                status: error.response.status,
                msg: error.response.data
            }
            return(err);
        });
        if (error) throw error;
    };
    return(conditions);
}

exports.createConditions = (idBoard, conditions, token, key) => {
    return new Promise( (resolve, reject) => {
        return getFirstList(idBoard, token, key)
        .then((idList) => {
            nameCard = 'Conditions_Data_Storage';
            return createCard(idList, nameCard, token, key)
            .then((idCard) => {
                return createComment(idCard, conditions, token, key)
                .then(() => {
                    console.log("Comment created");
                    resolve();
                })
                .catch((error) => {
                    reject(error);
                });
            })
            .catch((error) => {
                reject(error);
            });
        })
        .catch((error) => {
            reject(error);
        });
    });
}

exports.deleteBoard = (idBoard, token, key) => {
    return new Promise( (resolve, reject) => {
        const data = {
            params: {
                token,
                key
            }
        }
        return requestTrello.delete('/boards/' + idBoard, data)
        .then(() => {
            console.log("Board : deleted");
            resolve();
        });
    });
}

getFirstList = (idBoard, token, key) => {
    return new Promise( (resolve, reject) => {
        const data = {
            params: {
                token,
                key
            }
        }
        return requestTrello.get('/boards/' + idBoard + '/lists', data)
        .then((resp) => {
            resolve(idList = resp.data.find(list =>  list.pos===1).id);
        })
        .catch(error => {
            var err = {
                error: error.message + ' ( ' + error.response.statusText + ' )',
                status: error.response.status,
                msg: error.response.data
            }
            reject(err);
        });
    });
}

createCard = (idList, nameCard, token, key) => {
    return new Promise( (resolve, reject) => {
        const data = {
            name: nameCard,
            idList,
            token,
            key
        }
        return requestTrello.post('/cards', data)
        .then(resp => {
            console.log("Card : " + nameCard + " created");
            resolve(resp.data.id);
        })
        .catch(error => {
            var err = {
                error: error.message + ' ( ' + error.response.statusText + ' )',
                status: error.response.status,
                msg: error.response.data
            }
            reject(err);
        });
    });
}

createComment = (idCard, conditions, token, key) => {
    return new Promise( (resolve, reject) => {
        var content = '';

        /*conditions.forEach(element => {
            content += element.name + ':';
            element.branch.forEach((item) => {
                content += item.task + '=' + item.nameCondition + '/';
            })
            content += '\n';
        });*/
        content = JSON.stringify(conditions);
        const data = {
            text: content,
            token,
            key
        }
        return requestTrello.post('/cards/' + idCard + '/actions/comments', data)
        .then(resp => {
            console.log("Comment created.");
            resolve(resp.data.id);
        })
        .catch(error => {
            var err = {
                error: error.message + ' ( ' + error.response.statusText + ' )',
                status: error.response.status,
                msg: error.response.data
            }
            reject(err);
        });
    });
}