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
} from 'sequelize-typescript';

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
        allowNull: false,
    })
    declare name: string;

    @Column({
        type: DataType.STRING(800),
        allowNull: false,
    })
    declare password: string;

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
        type: DataType.STRING(10),
        allowNull: false,
        validate: {
            isIn: [['superadmin', 'admin', 'user']],
        },
        defaultValue: 'user',
    })
    declare role: string;

    @BeforeUpdate
    @BeforeCreate
    static async hashPassword(instance: Account) {
        if (instance.changed('password')) {
            if (!instance.password.startsWith('$2')) {
                const saltWorkFactor: number = env.SALT_WORK_FACTOR;
                const salt = await bcryptjs.genSalt(saltWorkFactor);
                instance.password = await bcryptjs.hash(instance.password, salt);
            }
        }

        if (instance.changed('email')) instance.email = instance.email.toLowerCase().trim();
    }

    async comparePassword(password: string): Promise<boolean> {
        return await bcryptjs.compare(password, this.password);
    }

    public override toJSON(): object {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...data } = super.toJSON() as Account;
        return data;
    }
}

export default Account;
