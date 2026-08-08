import { env } from '@config/env';
import bcryptjs from 'bcryptjs';
import {
    Table,
    Column,
    DataType,
    Index,
    Model,
    BeforeUpdate,
    BeforeCreate,
    BelongsTo,
    HasMany,
} from 'sequelize-typescript';
import City from './city.model';
import Notification from './notification.model';
import GarbageReport from './garbage-report.model';
import Collection from './collection.model';

@Table({
    schema: 'public',
})
class Account extends Model<Account, Partial<Account>> {
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
    declare name: string | null;

    @Column({
        type: DataType.STRING(10),
        allowNull: false,
        validate: {
            isIn: [['superadmin', 'admin', 'driver', 'user']],
        },
        defaultValue: 'user',
    })
    declare role: string;

    @Column({
        type: DataType.STRING(800),
        allowNull: true,
    })
    declare password: string | null;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    declare birthdate: Date | null;

    @Index
    @Column({
        type: DataType.STRING,
        allowNull: false,
        unique: {
            name: 'email',
            msg: 'An account with this email already exists.',
        },
        validate: {
            isEmail: {
                msg: 'The email provided is not valid.',
            },
        },
    })
    declare email: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    declare contact_number: string | null;

    @Column({
        type: DataType.JSON,
        allowNull: true,
    })
    declare location: {
        lat: number;
        lng: number;
    } | null;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    declare city_id: number | null;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    declare location_city: string | null;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    declare location_barangay: string| null;

    @BeforeUpdate
    @BeforeCreate
    static async hashPassword(instance: Account) {
        if (instance.changed('password') && instance.password) {
            if (!instance.password.startsWith('$2')) {
                const saltWorkFactor: number = env.SALT_WORK_FACTOR;
                const salt = await bcryptjs.genSalt(saltWorkFactor);
                instance.password = await bcryptjs.hash(instance.password, salt);
            }
        }

        if (instance.changed('email')) instance.email = instance.email.toLowerCase().trim();
    }

    async comparePassword(password: string): Promise<boolean> {
        if (!this.password) return false;

        return await bcryptjs.compare(password, this.password);
    }

    public override toJSON(): object {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...data } = super.toJSON() as Account;
        return data;
    }

    @BelongsTo(() => City, 'city_id')
    declare city: City;

    @HasMany(() => Notification, 'user_id')
    declare notifications: Notification[];

    @HasMany(() => GarbageReport, 'user_id')
    declare garbage_reports: GarbageReport[];

    @HasMany(() => Collection, 'user_id')
    declare collections: Collection[];
}

export default Account;
