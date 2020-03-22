//Camaro
const { transform } = require('camaro')
var tasks = []; 
var conditions = [];
var sequence = [];
var tasksConditions = [];
var tempPos;

getElementfromDiagram = async (xmlContent) => {
    tasks = [];
    conditions = [];
    tasksConditions = [];
    const result = await readBPMNToJson(xmlContent)
    const root = result.elem[0];
    sequence = root.sequenceFlow;

    // Fill tasks with start + tasks + end and add pos
    getAllTasks(root);
    var boardName = root.boardName;
    setConditions(root.exclusiveGateway);
    if (tasks.length === 0){
        return {error: 'You have to add some task'}
    }
    if (root.startEvent.id === '' || !root.endEvent.id === ''){
        return {error: 'You have to add start and end event'}
    }
    if (!boardName){
        return {error: 'You have to add a boardName'}
    }
    if (sequence.length === 0){
        return {error: 'You have to add links between object'}
    }

    var nextSequence = findSequence(root.startEvent.id);
    assignPosition(nextSequence);
    var error;
    tasksConditions.forEach(taskConditions => {
        taskConditions.conditions.forEach(condition => {
            if (condition.name === ''){
                error = {error: 'Condition must have a name'}
            }
            if (condition.choice === '') {
                error = {error: 'A condition must have choices'}
            }
        })
    })

    return (error ? error : {
        boardName,
        tasks,
        tasksConditions
    })
}

assignPosition = (nextSequence, lastTask = null, tabConditions = []) => {
    if(isTasks(nextSequence.source) && isCondition(nextSequence.target)){
        //Pos for the next task (we dodge condition to assign pos)
        tempPos = getTaskPos(nextSequence.source) + 1;
        var tabCond = sequence.filter(sequence => sequence.source === nextSequence.target);
        tabCond.forEach((cond) => {
            lastTask = nextSequence.source;
            assignPosition(cond, lastTask);
            tempPos = tempPos + 1;
        })
    } else if (isCondition(nextSequence.source) && isCondition(nextSequence.target)) {
        var tabSeq = sequence.filter(sequence => sequence.source === nextSequence.target);
        conditionToAdd = conditions.find(condition => condition.id === nextSequence.source);
        conditionToAdd.idUnique = nextSequence.id;
        conditionToAdd.choice = nextSequence.name;
        tabConditions.push(conditionToAdd);
        tabSeq.forEach((cond) => {
            var temp = Array.from(tabConditions);
            assignPosition(cond, lastTask, temp);
            tempPos = tempPos + 1;
        })
    } else {
        if (isCondition(nextSequence.source) && isTasks(nextSequence.target)){
            conditionToAdd = conditions.find(condition => condition.id === nextSequence.source);
            conditionToAdd.choice = nextSequence.name;
            conditionToAdd.idUnique = nextSequence.id;
            tabConditions.push(conditionToAdd);
            setTaskCondition(nextSequence.target, tabConditions);
            setPreviousTask(nextSequence.target, lastTask);
            setTaskPos(nextSequence.target, tempPos);
            tabConditions = [];
        } else {
            setPreviousTask(nextSequence.target, nextSequence.source);
            setTaskPos(nextSequence.target, getTaskPos(nextSequence.source) +1 );
        }
        nextSequence = findSequence(nextSequence.target);
        if (nextSequence) {
            assignPosition(nextSequence);
        }
    }
}

setTaskCondition = (idTask, tabConditions) => {
    tasksConditions.push({
        idTask,
        conditions: [],
        lastTask: []
    });
    item = tasksConditions.find(taskConditions => taskConditions.idTask === idTask);
    tabConditions.forEach(condition => {
        item.conditions.push({
            name: condition.name,
            choice: condition.choice,
            id: condition.id,
            idUnique: condition.idUnique
        })
    })
}

setPreviousTask = (idTask, lastTask) => {
    if(tasksConditions.find(taskConditions => taskConditions.idTask === idTask)){
        tasksConditions.find(taskConditions => taskConditions.idTask === idTask).lastTask.push(lastTask);
    } else {
        tasksConditions.push({
            idTask,
            conditions: [],
            lastTask: [lastTask]
        });
    }
}


findSequence = (id) => {
    return sequence.find(sequence => sequence.source === id);
}

// Define conditions
setConditions = (allConditions) => {
    allConditions.forEach(condition => {
        conditions.push({
            name: condition.name,
            id: condition.id
        });
    })
}

// Check if the id object is a condition
isCondition = (id) => {
    return conditions.find(condition => condition.id === id) != null;
}

// Check if the id object is a task
isTasks = (id) => {
    return tasks.find(task => task.id === id) != null;
}

getAllTasks = (root) => {
    tasks.push({
        name: root.startEvent.name,
        id: root.startEvent.id,
        pos: 1
    });

    root.tasks.forEach(task => {
        tasks.push({
            name: task.name,
            id: task.id,
            pos: 0
        });
    });

    tasks.push({
        name: root.endEvent.name,
        id: root.endEvent.id,
        pos: 1
    });
}

getTaskPos = (id) => {
    return tasks.find(task => task.id === id).pos;
}

setTaskPos = (id, pos) => {
    if (getTaskPos(id) < pos) {
        tasks.find(task => task.id === id).pos = pos;
    }
}


readBPMNToJson = async function (xmlContent) {
    return result = await transform(xmlContent, {
        elem: [
            '/definitions',
            {
                boardName: 'collaboration/participant/@name',
                startEvent: {
                    name: 'process/startEvent/@name',
                    id: 'process/startEvent/@id'
                },
                tasks: ['process/task', {
                    id: '@id',
                    name: '@name'
                }],
                sequenceFlow: ['process/sequenceFlow', {
                    source: '@sourceRef',
                    target: '@targetRef',
                    name: '@name',
                    id: '@id'
                }],
                exclusiveGateway: ['process/exclusiveGateway', {
                    id: '@id',
                    name: '@name'
                }],
                endEvent: {
                    name: 'process/endEvent/@name',
                    id: 'process/endEvent/@id'
                },
            }
        ]
    })
}

module.exports = {
    getElementfromDiagram,
}
