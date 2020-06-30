var read = require('../readDiagram/readBPMN');
var assert = require('assert');
var expect = require('expect.js');

describe('ReadBPMN function testing', () => {

    before( (done) => {
        // Tasks
        const root = {
            startEvent: {
                name: 'startName',
                id: 'taskStart'
            },
            tasks: [{
                name: 'task1Name',
                id: 'task1Id'
            },{
                name: 'task2Name',
                id: 'task2Id'
            }],
            userTasks: [{
                name: 'task3Name',
                id: 'task3Id',
                assigned: 'flavien1/flavien2',
                forms: []
            }],
            endEvent: {
                name: 'endName',
                id: 'taskEnd'
            },
        };
        read.getAllTasks(root);

        // Conditions (Gateway)
        const allConditions = [{
            id: 'cond1',
            name: 'Condition1'
        },
        {
            id: 'cond2',
            name: 'Condition2'
        }];
        read.setConditions(allConditions);
        done();
    })

    describe('getAllTasks testing', () => {

        it('tasks should be defined', () => {
            expect(read.tasks).not.to.be(undefined);
        });

        it('tasksStart should be defined', () => {
            expect(read.tasks.find(task => task.name === 'startName')).not.to.be(null);
        });

        it('tasksUser should be defined and have 2 assigned', () => {
            expect(read.tasks.find(task => task.name === 'task3Name').assigned).to.contain('flavien1');
            expect(read.tasks.find(task => task.name === 'task3Name').assigned).to.contain('flavien2');
            expect(read.tasks.find(task => task.name === 'task3Name').assigned).not.to.contain('flavien3');
        });
    });

    describe('Getter and setter about tasks testing', () => {

        it('getTasksPos: should be 3', () => {
            read.tasks.find(task => task.name === 'task3Name').pos = 3;
            expect(getTaskPos('task3Id')).to.be(3);
        });

        it('setTaskPos: should be 4', () => {
            setTaskPos('task3Id', 4);
            expect(getTaskPos('task3Id')).to.be(4);
            // Should not change if new pos < current pos
            setTaskPos('task3Id', 3);
            expect(getTaskPos('task3Id')).to.be(4);
        });

        it('isTasks', () => {
            expect(isTasks('task3Id')).to.be(true);
            expect(isTasks('task4Id')).to.be(false);
        });

        it('setNextTask', () => {
            expect(read.tasksConditions.length).to.equal(0);
            setNextTask('task1Id', 'task3Id');
            setNextTask('task1Id', 'task2Id');
            expect(read.tasksConditions.length).to.equal(1);
            setNextTask('task2Id', 'task3Id');
            expect(read.tasksConditions.length).to.equal(2);
            expect(read.tasksConditions.find(task => task.idTask === 'task1Id').nextTask).to.contain('task3Id');
        });
    });

    describe('setConditions: Get all condition from XML', () => {

        it('conditions should be defined', () => {
            expect(read.conditions).not.to.be(undefined);
            expect(read.conditions.length).not.to.equal(0);
        });
    });

    describe('setConditions: Get all condition from XML', () => {

        it('conditions should be defined', () => {
            expect(read.conditions).not.to.be(undefined);
            expect(read.conditions.length).not.to.equal(0);
        });
    });
    
    describe('Getter and setter about conditions testing', () => {

        it('setConditionPos', () => {
            expect(read.conditions.find(condition => condition.id === 'cond1').pos).to.be(undefined);
            read.setPosCondition(2);
            read.setConditionPos('cond1');
            expect(read.conditions.find(condition => condition.id === 'cond1').pos).to.equal(2);
            // Should not change because this condition already have a position
            read.setPosCondition(3);
            read.setConditionPos('cond1');
            expect(read.conditions.find(condition => condition.id === 'cond1').pos).to.equal(2);
        });

        it('isCondition', () => {
            expect(isCondition('cond1')).to.be(true);
            expect(isCondition('task4Id')).to.be(false);
        });
    });

    describe('setChoiceSequence', () => {
        it('Check setting', () => {
            // Sequence
            const sequence = [{
                source: 'source1',
                target: 'target1',
                expression: "${test == 'Offline'}",
                id: 'seq1'
            },
            {
                source: 'source2',
                target: 'target2',
                expression: "${!approved}",
                id: 'seq2'
            },
            {
                source: 'source3',
                target: 'target3',
                expression: "${amount > 1000}",
                id: 'seq3'
            }];
            read.setSequence(sequence);
            read.setChoiceSequence();
            // Seq1
            expect(sequence.find(seq => seq.id === 'seq1').choice.nameVar).to.be('test');
            expect(sequence.find(seq => seq.id === 'seq1').choice.value).to.be('Offline');
            expect(sequence.find(seq => seq.id === 'seq1').choice.type).to.be('string');
            expect(sequence.find(seq => seq.id === 'seq1').choice.operator).to.be('==');

            // Seq2
            expect(sequence.find(seq => seq.id === 'seq2').choice.nameVar).to.be('approved');
            expect(sequence.find(seq => seq.id === 'seq2').choice.value).to.be(false);
            expect(sequence.find(seq => seq.id === 'seq2').choice.type).to.be('boolean');
            expect(sequence.find(seq => seq.id === 'seq2').choice.operator).to.be(undefined);

            // Seq3
            expect(sequence.find(seq => seq.id === 'seq3').choice.nameVar).to.be('amount');
            expect(sequence.find(seq => seq.id === 'seq3').choice.value).to.equal('1000');
            expect(sequence.find(seq => seq.id === 'seq3').choice.type).to.be('number');
            expect(sequence.find(seq => seq.id === 'seq3').choice.operator).to.be('>');
        });
    });
});
