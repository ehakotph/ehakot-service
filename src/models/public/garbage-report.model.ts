import {
    Table,
    Column,
    DataType,
    Model,
    BelongsTo,
} from 'sequelize-typescript';
import Account from './account.model';
import Collection from './collection.model';

@Table({
    schema: 'public',
})
class GarbageReport extends Model<GarbageReport, Partial<GarbageReport>> {
    @Column({
        primaryKey: true,
        type: DataType.INTEGER,
        autoIncrement: true,
    })
    declare id: number;

    @Column({
        type: DataType.JSON,
        allowNull: false,
    })
    declare location: {
        lat: number;
        lng: number;
    };

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare location_city: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare location_barangay: string

    @Column({
        type: DataType.ENUM('ACTIVE', 'ASSUMPTION_COLLECTED', 'COLLECTED'),
        allowNull: false,
        defaultValue: 'ACTIVE',
    })
    declare status: 'ACTIVE' | 'ASSUMPTION_COLLECTED' | 'COLLECTED';

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    declare confirmation_date: Date | null;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare user_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    declare collection_id: number | null;

    @BelongsTo(() => Account, 'user_id')
    declare user: Account;

    @BelongsTo(() => Collection, 'collection_id')
    declare collection: Collection;
}

export default GarbageReport;
