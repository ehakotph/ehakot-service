import {
    Table,
    Column,
    DataType,
    Model,
} from 'sequelize-typescript';

@Table({
    schema: 'public',
})
class City extends Model<City, Partial<City>> {
    @Column({
        primaryKey: true,
        type: DataType.INTEGER,
        autoIncrement: true,
    })
    declare id: number;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare name: string;
}

export default City;
