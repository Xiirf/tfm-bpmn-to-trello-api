var read = require('../readDiagram/readBPMN');
var assert = require('assert');
var expect = require('expect.js');

describe('ReadBPMN function testing', () => {

    before( (done) => {
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
        }
        read.getAllTasks(root);
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
    });

    /*describe('Getter and setter about tasks testing', () => {

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
    });*/
});

