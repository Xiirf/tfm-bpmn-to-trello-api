//Camaro
const { transform } = require('camaro')
var tasks = []; 
var conditions = [];
var sequence = [];

getElementfromDiagram = async (xmlContent) => {
    tasks = [];
    conditions = [];
    const result = await readBPMNToJson(xmlContent)
    const root = result.elem[0];
    sequence = root.sequenceFlow;

    // Fill tasks with start + tasks + end and add pos
    getAllTasks(root);
    var boardName = root.boardName;
    setConditions(root.exclusiveGateway);

    // TODO Si plusieurs conditions à la suite??
    // TODO check si on a bien une tâche start et end
    /*
    // Position
    var tempPos = null;
    for (var i = sequence.length-1; i >= 0; i--) {
        // If next target is condition
        if(isCondition(sequence[i].target)){
            //Pos for the next task (we dodge condition to assign pos)
            tempPos = getTaskPos(sequence[i].source);
        } else if (isCondition(sequence[i].source) && isTasks(sequence[i].target)){
            //In this case with just have 1 condition and then a task
            setBranchCondition(sequence[i].source, sequence[i].target, sequence[i].name);
        } else {
            if (!tempPos) {
                setTaskPos(sequence[i].target, getTaskPos(sequence[i].source) +1 );
            }else {
                setTaskPos(sequence[i].target, getTaskPos(sequence[i].source) +1 );
            }
        }
    }*/
    // Get the first link
    console.log(JSON.stringify(conditions));
    var nextSequence = findSequence(root.startEvent.id);
    assignPosition(nextSequence);

    return {
        boardName,
        tasks,
        conditions
    }
}

assignPosition = (nextSequence, tempPos = null) => {

    if(isTasks(nextSequence.source) && isCondition(nextSequence.target)){
        //Pos for the next task (we dodge condition to assign pos)
        tempPos = getTaskPos(nextSequence.source) + 1;
        var tabCond = sequence.filter(sequence => sequence.source === nextSequence.target);
        tabCond.forEach((cond) => {
            assignPosition(cond, tempPos);
            tempPos = tempPos + 1;
        })
    } else {
        if (isCondition(nextSequence.source) && isTasks(nextSequence.target)){
            //In this case with just have 1 condition and then a task
            setBranchCondition(nextSequence.source, nextSequence.target, nextSequence.name);
            setTaskPos(nextSequence.target, tempPos);
        } else {
            setTaskPos(nextSequence.target, getTaskPos(nextSequence.source) +1 );
        }
        nextSequence = findSequence(nextSequence.target);
        if (nextSequence) {
            assignPosition(nextSequence);
        }
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
            id: condition.id,
            branch: [],
        });
    })
}

setBranchCondition = (idCondition, idTarget, nameCondition) => {
    conditions.find(condition => condition.id === idCondition).branch.push({
        task: idTarget,
        nameCondition
    });
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
    tasks.find(task => task.id === id).pos = pos;
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
                    name: '@name'
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
