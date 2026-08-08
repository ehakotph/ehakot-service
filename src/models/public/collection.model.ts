import {
    Table,
    Column,
    DataType,
    Model,
    BelongsTo,
} from 'sequelize-typescript';
import City from './city.model';
import Account from './account.model';
import Truck from './truck.model';

@Table({
    schema: 'public',
})
class Collection extends Model<Collection, Partial<Collection>> {
    @Column({
        primaryKey: true,
        type: DataType.INTEGER,
        autoIncrement: true,
    })
    declare id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare city_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    declare driver_id: number | null;

    @Column({
        type: DataType.JSON,
        allowNull: false,
    })
    declare barangays: string[];

    @Column({
        type: DataType.ENUM('PENDING', 'ONGOING', 'COMPLETED'),
        allowNull: false,
        defaultValue: 'PENDING',
    })
    declare status: 'PENDING' | 'ONGOING' | 'COMPLETED';

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    declare truck_id: number| null;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare date_of_week: number;

    @Column({
        type: DataType.DATE,
        allowNull: false,
    })
    declare date: Date;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare from: string;
    
    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare to: string;
    
    @BelongsTo(() => City, 'city_id')
    declare city: City;

    @BelongsTo(() => Account, 'driver_id')
    declare driver: Account;

    @BelongsTo(() => Truck, 'truck_id')
    declare truck: Truck;
}

export default Collection;
