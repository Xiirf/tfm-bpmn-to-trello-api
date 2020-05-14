// Trello request
const requestBase = require('./request');
require('dotenv').config();

var requestTrello = requestBase();

// Create a board
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

// Add a member to a board
exports.addMember =  async (idBoard, conditions, token, key) => {
    for (condition of conditions) {
        const data = {
            params: {
                token,
                key
            }
        }
        for (idMember of condition.assigned) {
            const idAdmin = await requestTrello.get('/members/me', data)
                .then(async resp => {
                    return resp.data.id
                });
            type = 'normal'
            if (idAdmin === idMember) {
                type = 'admin'
            }
            const data2 = {
                token,
                key,
                type
            }
            await requestTrello.put('/boards/' + idBoard + '/members/' + idMember, data2)
                .then(_ => {
                    console.log('Member ' + idMember + 'added to the board')
                })
                .catch(error => {
                    var err = {
                        error: error.message + ' ( ' + error.response.statusText + ' )',
                        status: error.response.status,
                        msg: error.response.data
                    }
                    throw err;   
                });     
        }
    }
    return (conditions);
}

// Create a list in a board
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
        .then(async resp => {
            console.log("List : " + task.name + " created");
            //Change task by the listId
            for (condition of conditions) {
                if (condition.idTask === task.id) {
                    condition.idTask = resp.data.id;
                    if (condition.assigned.length > 0) {
                        const assigned = [];
                        // Assign member to card
                        for (idMember of condition.assigned) {
                            const error = await requestTrello.get('/members/' + idMember, data)
                            .then(async resp => {
                                assigned.push(resp.data.id);
                            })
                            .catch(error => {
                                if (error.response.data === 'model not found') {
                                    error.response.data = 'El usuario Trello ' + idMember + ' no existe'
                                }
                                var err = {
                                    error: error.message + ' ( ' + error.response.statusText + ' )',
                                    status: error.response.status,
                                    msg: error.response.data
                                }
                                return(err);
                            });
                            if (error) throw error;       
                        }
                        condition.assigned = assigned;
                    }
                } else {
                    const index = condition.lastTask.indexOf(task.id);
                    if (index > -1) {
                        condition.lastTask.splice(index, 1);
                        condition.lastTask.push(resp.data.id);
                    }
                }
            }
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

// Save data in a comment in a card
exports.createConditions = (idBoard, conditions, token, key) => {
    return new Promise( (resolve, reject) => {
        // Get the first list
        getFirstList(idBoard, token, key)
        .then((idList) => {
            nameCard = 'Conditions_Data_Storage';
            // Create the card
            createCard(idList, nameCard, token, key)
            .then((idCard) => {
                // Create the commment and set his content with the data
                createComment(idCard, conditions, token, key)
                .then(() => {
                    console.log("Comment created");
                    // Close the card to archive her
                    closeCard(idCard, token, key)
                    .then(() => {
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
        })
        .catch((error) => {
            reject(error);
        });
    });
}

// Delete a board, using when there is an error to dont have multiple board created in Trello
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

// Get the id of the first list of the board
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

// Create a card in a list
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

// Create a comment in a card
createComment = (idCard, conditions, token, key) => {
    return new Promise( (resolve, reject) => {
        var content = '';

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

// Archive a card
closeCard = (idCard, token, key) => {
    return new Promise( (resolve, reject) => {
        const data = {
            token,
            key,
            closed: true
        }
        return requestTrello.put('/cards/' + idCard, data)
        .then(resp => {
            console.log("Card : " + nameCard + " closed");
            resolve();
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

// Add Power up
exports.addPowerUp = (idBoard, idPowerUp, token, key) => {
    return new Promise( (resolve, reject) => {
        if (idPowerUp === null || idPowerUp === undefined) {
            resolve();
        }
        const data = {
            idPlugin: idPowerUp,
            token,
            key
        }
        return requestTrello.post('/boards/' + idBoard + '/boardPlugins', data)
        .then((resp) => {
            resolve();
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