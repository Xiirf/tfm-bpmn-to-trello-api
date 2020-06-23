// File grouping all the methods used to read a BPMN diagram 
// and to bring out the important information for the generation on Trello
// Import from Camaro to read an XML file (BPMN)
const { transform } = require('camaro')
var tasks = []; 
var conditions = [];
var sequence = [];
var tasksConditions = [];
var tempPos;
var posCondition;
var error;

getElementfromDiagram = async (xmlContent) => {
    error = null;
    tasks = [];
    conditions = [];
    tasksConditions = [];
    const result = await readBPMNToJson(xmlContent)
    const root = result.elem[0];
    sequence = root.sequenceFlow;
    posCondition = 1;

    // Fill tasks with start + tasks + end and add pos
    getAllTasks(root);
    if (error) {
        return error;
    }
    var boardName = root.boardName;
    // Get all condition
    setConditions(root.exclusiveGateway);
    if (tasks.length === 0){
        return {error: 'You have to add some task'}
    }
    // Check if all value from form have all requisite 
    tasks.forEach(task => {
        if (task.forms.length > 0){
            task.forms.forEach(form => {
                if (form.label === '' || form.id === '' || form.type === ''){
                    error = {error: 'You have to add an id, label and type for each formData'};
                }
            })
        }
    });
    if (error) {
        return error;
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

    var error = setChoiceSequence();
    if (error) {
        return error;
    }
    // Test if all choices of a condition use the same var
    sequence.forEach(seq => {
        if (seq.choice) {
            const nameVarToRespect = seq.choice.nameVar;
            let results = sequence.filter( sequence => sequence.source === seq.source);
            results.forEach(sequence => {
                if (sequence.choice) {
                    if (sequence.choice.nameVar !== nameVarToRespect) {
                        error = {error: 'All choices condition should use the same var'};
                    }
                }
            })
        }
    });

    if (error) {
        return error;
    }

    var nextSequence = findSequence(root.startEvent.id);
    assignPosition(nextSequence);
    // Set the endind task at the end
    tasks.find(task => task.id === root.endEvent.id).pos = tempPos+1;

    // Check if all condition have a name and a choice
    tasksConditions.forEach(taskConditions => {
        taskConditions.conditions.forEach(condition => {
            if (condition.name === ''){
                error = {error: 'Condition must have a name'}
            } else if (condition.name && !condition.choice) {
                error = {error: 'A condition must have choices (Expression)'}
            }
        })
    });

    //Add all value possibility for string form param
    setFormStringValue();

    // Add form to taskConditions and assigned members

    tasks.forEach(task => {
        if (task.forms.length > 0){
            tasksConditions.find(taskCondition => taskCondition.idTask === task.id).forms = task.forms;
        }
        if (task.assigned.length > 0) {
            tasksConditions.find(taskCondition => taskCondition.idTask === task.id).assigned = task.assigned;
        }
    });

    return (error ? error : {
        boardName,
        tasks,
        tasksConditions
    })
}

// Method using all file method to set all condition to the corresponding task,
// set all previous tasks from another task
// set all position
// It help to have all needed information from BPMN in Trello
assignPosition = (nextSequence, lastTask = null, tabConditions = []) => {
    // In this case the source is a task and the destination element is a condition
    if(isTasks(nextSequence.source) && isCondition(nextSequence.target)){
        //Pos for the next task (we dodge condition to assign pos)
        tempPos = getTaskPos(nextSequence.source) + 1;
        var tabCond = sequence.filter(sequence => sequence.source === nextSequence.target);
        tabCond.forEach((cond) => {
            lastTask = nextSequence.source;
            assignPosition(cond, lastTask);
            tempPos = tempPos + 1;
        })
    // In this case the source is a condition and the destination element is also a condition
    } else if (isCondition(nextSequence.source) && isCondition(nextSequence.target)) {
        var tabSeq = sequence.filter(sequence => sequence.source === nextSequence.target);
        setConditionPos(nextSequence.source);
        conditionToAdd = conditions.find(condition => condition.id === nextSequence.source);
        conditionToAdd.idUnique = nextSequence.id;
        conditionToAdd.choice = nextSequence.choice;
        tabConditions.push(conditionToAdd);
        tabSeq.forEach((cond) => {
            var temp = Array.from(tabConditions);
            assignPosition(cond, lastTask, temp);
            tempPos = tempPos + 1;
        })
    } else {
        // In this case the source is a condition and the destination element is a task
        if (isCondition(nextSequence.source) && isTasks(nextSequence.target)){
            setConditionPos(nextSequence.source);
            conditionToAdd = conditions.find(condition => condition.id === nextSequence.source);
            conditionToAdd.choice = nextSequence.choice;
            conditionToAdd.idUnique = nextSequence.id;
            tabConditions.push(conditionToAdd);
            setNextTask(lastTask, nextSequence.target);
            setTaskCondition(lastTask, nextSequence.target, tabConditions);
            //setPreviousTask(nextSequence.target, lastTask);
            // on set pas la pos si on reviens sur nos pas 
            // Si il set pos si c'est le dernier élément
            if (getTaskPos(nextSequence.target) < tempPos && !getTaskPos(nextSequence.target)==0 && findSequence(nextSequence.target) != undefined) {
                var isComingback = true;
            } else {
                setTaskPos(nextSequence.target, tempPos);
                var isComingback = false;
            }
            
            tabConditions = [];
        } else {
            // In this case the source is a task and the destination element is also a task
            //setPreviousTask(nextSequence.target, nextSequence.source);
            setNextTask(nextSequence.source, nextSequence.target);
            setTaskPos(nextSequence.target, getTaskPos(nextSequence.source) +1 );
        }
        nextSequence = findSequence(nextSequence.target);
        // If it's not the last element so we can call the fonction again (recursive method)
        if (nextSequence) {
            // test if we are not coming back
            if (!isComingback) {
                assignPosition(nextSequence);
            }
        }
    }
}

// Assign a position to a condition if it is not already set
setConditionPos = (id) => {
    if (!conditions.find(condition => condition.id === id).pos){
        conditions.find(condition => condition.id === id).pos = posCondition;
        posCondition += 1;
    }
}

// Add the condition in the conditions array for the task with the given id
setTaskCondition = (idTask, nextTask, tabConditions) => {
    if (!tasksConditions.find(taskConditions => taskConditions.idTask === idTask)) {
        tasksConditions.push({
            idTask,
            conditions: [],
            nextTask: [],
            forms: [],
            assigned: []
        });
    }
    item = tasksConditions.find(taskConditions => taskConditions.idTask === idTask);
    
    tabConditions.forEach(condition => {
        // Check if the condition is already added
        if (!item.conditions.find(cond => cond.choice === condition.choice)){
            item.conditions.push({
                name: condition.name,
                choice: condition.choice,
                id: condition.id,
                idUnique: condition.idUnique,
                posCondition: condition.pos,
                destination: nextTask
            });
        }
    });
}

// Add all possible values for the form variable (string only)
setFormStringValue = () => {
    tasks.forEach(task => {
        if (task.forms.length > 0){
            for (form of task.forms) {
                const value = [];
                tasksConditions.forEach(taskConditions => {
                    taskConditions.conditions.forEach(condition => {
                        if (condition.choice.nameVar === form.nameVar && form.type === 'string'){
                            if (!value.includes(condition.choice.value)) {
                                value.push(condition.choice.value);
                            }
                        } 
                    });
                });
                form.value = value;
            }
        }
    });
}
// Add next task for the given id task
setNextTask = (idTask, nextTask) => {
    if(tasksConditions.find(taskConditions => taskConditions.idTask === idTask)){
        tasksConditions.find(taskConditions => taskConditions.idTask === idTask).nextTask.push(nextTask);
    } else {
        tasksConditions.push({
            idTask,
            conditions: [],
            nextTask: [nextTask],
            forms: [],
            assigned: []
        });
    }
}

// Add previous task for the given id task
setPreviousTask = (idTask, lastTask) => {
    if(tasksConditions.find(taskConditions => taskConditions.idTask === idTask)){
        tasksConditions.find(taskConditions => taskConditions.idTask === idTask).lastTask.push(lastTask);
    } else {
        tasksConditions.push({
            idTask,
            conditions: [],
            lastTask: [lastTask],
            forms: [],
            assigned: []
        });
    }
}

// Return the sequence for the given id
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

// Set all tasks (Normal task, start and end task, user task)
getAllTasks = (root) => {
    // First task (startEvent)
    tasks.push({
        name: root.startEvent.name,
        id: root.startEvent.id,
        pos: 1,
        assigned: [],
        forms: []
    });

    // Classic tasks
    root.tasks.forEach(task => {
        tasks.push({
            name: task.name,
            id: task.id,
            pos: 0,
            assigned: [],
            forms: []
        });
    });

    // User tasks
    root.userTasks.forEach(task => {
        const assigned = [];
        if (task.assigned !== '') {
            task.assigned.split('/').forEach(assignee => {
                if (assignee.trim() !== '') {
                    assigned.push(assignee.trim());
                }
            });
        }

        tasks.push({
            name: task.name,
            id: task.id,
            pos: 0,
            assigned,
            forms: task.forms
        });
    });

    // Last task (endEvent)
    tasks.push({
        name: root.endEvent.name,
        id: root.endEvent.id,
        pos: 1,
        assigned: [],
        forms: []
    });
}

// Get task position from his id
getTaskPos = (id) => {
    return tasks.find(task => task.id === id).pos;
}

// Set the position for the given task id 
setTaskPos = (id, pos) => {
    if (getTaskPos(id) < pos) {
        tasks.find(task => task.id === id).pos = pos;
    }
}

// Get all information about different expression to save it in Trello
setChoiceSequence = () => {
    let error;
    const tabOperator = ['<=', '<', '>=', '>'];
    sequence.forEach(sequence => {
        if (sequence.expression !== '') {
            // Clear string
            // Delete all space
            let expression = sequence.expression.replace(/\s+/g, '');
            // Delete ${ at the start of the expression
            const firstIndex = expression.indexOf('$');
            expression = expression.substring(firstIndex + 2);
            // Delete } at the end of the expression
            const lastIndex = expression.lastIndexOf('}');
            expression = expression.substring(0, lastIndex);

            let type;
            let nameVar;
            let operator;
            let value;
            // In this caser we can use string or number
            if (expression.includes('==')) {
                operator = '==';
                const tempSubString = expression.split(operator);
                nameVar = tempSubString[0];
                isNaN(tempSubString[1]) ? type = 'string' : type = 'number';
                value = tempSubString[1];
                // If it's a string delete ' at the start and ' at the end for the value
                if (type === 'string') {
                    const firstIndex = value.indexOf("'");
                    value = value.substring(firstIndex + 1);
                    // Delete } at the end of the expression
                    const lastIndex = value.lastIndexOf("'");
                    value = value.substring(0, lastIndex);
                }
            // In this case we are using number
            } else if (tabOperator.some(op => expression.includes(op))) {
                if (expression.includes('<=')) {
                    operator = '<=';
                } else if (expression.includes('<')) {
                    operator = '<';
                } else if (expression.includes('>=')) {
                    operator = '>=';
                } else if (expression.includes('>')) {
                    operator = '>';
                } 
                const tempSubString = expression.split(operator);
                isNaN(tempSubString[1]) ? type = 'string' : type = 'number';
                if (type === 'string') {
                    error = {error: 'You cant use string with operator: ' + operator};
                } else {
                    nameVar = tempSubString[0];
                    value = tempSubString[1];
                }  
            } else {
                // Last case, we got a boolean
                type = 'boolean';
                if (expression.indexOf('!') === 0) {
                    value = false;
                    nameVar = expression.substring(1);
                } else {
                    value = true;
                    nameVar = expression;
                }
            }
            
            if (!error) {
                sequence.choice = {
                    nameVar,
                    value,
                    type,
                    operator
                }
            }
        }
    });
    return error;
}

// Extract all information from xml using transform from camaro
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
                userTasks: ['process/userTask', {
                    id: '@id',
                    name: '@name',
                    assigned: '@camunda:assignee',
                    forms: ['extensionElements/camunda:formData/camunda:formField', {
                        nameVar: '@id',
                        label: '@label',
                        type: '@type'
                    }]
                }],
                sequenceFlow: ['process/sequenceFlow', {
                    source: '@sourceRef',
                    target: '@targetRef',
                    expression: 'conditionExpression',
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

// Methode for testing to set variable
setPosCondition = (pos) => {
    posCondition = pos;
}

setSequence = (sequences) => {
    sequence = sequences;
}

module.exports = {
    getElementfromDiagram,
    tasks,
    getAllTasks,
    getTaskPos,
    setTaskPos,
    isTasks,
    sequence,
    setPreviousTask,
    tasksConditions,
    setConditions,
    conditions,
    isCondition,
    setConditionPos,
    posCondition,
    setPosCondition,
    setSequence,
    setChoiceSequence
}
