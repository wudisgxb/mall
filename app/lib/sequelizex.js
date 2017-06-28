/**
 * Created by me on 15-12-1.
 */

var Sequelize = require('sequelize');

var DataTypes = Sequelize;

var String = (num, allowNull) => {
    if (!num) {
        num = 2048;
    }
    if (!allowNull) {
        allowNull = false;
    }
    return {
        type: DataTypes.STRING(num),
        allowNull
    }
};

var Double = (defaultValue) => {
    if (typeof defaultValue === 'undefined') {
        defaultValue = 0;
    }
    return {
        type: DataTypes.DOUBLE,
        defaultValue
    }
};

var Int = (defaultValue) => {
    if (typeof defaultValue === 'undefined') {
        defaultValue = 0;
    }
    return {
        type: DataTypes.INTEGER,
        defaultValue
    }
};

var Phone = (allowNull) => {
    if (typeof allowNull === 'undefined') {
        allowNull = false;
    }
    return {
        type: DataTypes.STRING(11),
        allowNull,
        validate: {
            is: /^\d{11}$/
        }
    }
};

var Url = () => {
    return {
        type: DataTypes.STRING,
        allowNull: false,
        vialidate: {
            isUrl: true
        }
    }
};

var Date = (defaultValue) => {
    if (typeof defaultValue === 'undefined') {
        defaultValue = Sequelize.NOW;
    }
    return {
        type: Sequelize.DATE,
        defaultValue
    }
};

var Bool = () => {
    return {
        type: Sequelize.BOOLEAN
    }
};

var Text = () => {
    return {
        type: Sequelize.TEXT
    }
};

var filterByStatus = (status) =>{
    return function *(conditions) {
        conditions.where = {
            status: status
        };
        return yield this.findAll(conditions);
    };
};

module.exports = {
    DataTypes: {
        String,
        Phone,
        Int,
        Url,
        Date,
        Double,
        Bool,
        Text
    },
    Func: {
        filterByStatus
    }
};