import {
    Table,
    Column,
    DataType,
    Model,
    BelongsTo,
} from 'sequelize-typescript';
import Account from './account.model';

@Table({
    schema: 'public',
})
class Notification extends Model<Notification, Partial<Notification>> {
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
    declare title: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    declare description: string | null;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare user_id: number;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    declare read_at: Date | null;

    @BelongsTo(() => Account, 'user_id')
    declare user: Account;
}

export default Notification;
