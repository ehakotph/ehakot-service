import {
    Table,
    Column,
    DataType,
    Model,
    BelongsTo,
    HasMany,
} from 'sequelize-typescript';
import City from './city.model';
import Collection from './collection.model';

@Table({
    schema: 'public',
})
class Truck extends Model<Truck, Partial<Truck>> {
    @Column({
        primaryKey: true,
        type: DataType.INTEGER,
        autoIncrement: true,
    })
    declare id: number;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    declare plate_number: string | null;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare city_id: number;

    @BelongsTo(() => City, 'city_id')
    declare city: City;

    @HasMany(() => Collection, 'truck_id')
    declare collections: Collection[];
}

export default Truck;
