import {
    Table,
    Column,
    DataType,
    Model,
    BelongsTo,
    ForeignKey,
} from 'sequelize-typescript';
import City from './city.model';

@Table({
    schema: 'public',
})
class Barangay extends Model<Barangay, Partial<Barangay>> {
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

    @ForeignKey(() => City)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare city_id: number;

    @BelongsTo(() => City, 'city_id')
    declare city: City;
}

export default Barangay;
