import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


export enum OutboxStatus {
    PENDING = 'pending',
    SENT = 'sent',
    FAILED = 'failed',
}


@Entity('outbox')
export class OutBoxEntity {
    @PrimaryGeneratedColumn('uuid')
    id:string
    @Column()
    routingKey: string;
    @Column('json')
    payload:any

    @Column({
        type: 'enum',
        enum: OutboxStatus,
        default: OutboxStatus.PENDING,
    })
    status: OutboxStatus;

    @Column({ default: 0 })
    retryCount: number;

    @Column({ type: 'varchar', length: 20, nullable: true })
    exchangeType: string | null;

    @Column({ type: 'json', nullable: true })
    exchangeOptions: any | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    sentAt: Date | null;


}