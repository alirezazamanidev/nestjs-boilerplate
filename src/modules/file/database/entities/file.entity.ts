import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Index,
} from 'typeorm';

export enum UploadState {
    PENDING = 'pending',
    UPLOADED = 'uploaded',
}

export enum VerificationState {
    NOT_STARTED = 'not_started',
    MIME_CHECKING = 'mime_checking',
    MIME_OK = 'mime_ok',
    MIME_FAILED = 'mime_failed',
}

@Entity('files')
@Index('idx_files_user_id', ['userId'])
@Index('idx_files_fileable', ['fileableType', 'fileableId'])
@Index('idx_files_client_user_created_at', ['clientId', 'userId', 'createdAt'])
@Index('ux_files_bucket_object', ['bucket', 'objectName'], { unique: true })
export class File {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', nullable: true })

    userId: string | null;

    @Column({ type: 'enum', enum: UploadState, default: UploadState.PENDING })
    uploadState: UploadState;

    @Column({
        type: 'enum',
        enum: VerificationState,
        default: VerificationState.NOT_STARTED,
    })
    verificationState: VerificationState;

    @Column()
    bucket: string;

    @Column()
    objectName: string;

    @Column()
    fileName: string;

    @Column({ type: 'timestamptz', nullable: true })
    linkedAt: Date | null;

    @Column({ nullable: true, type: 'timestamptz' })
    expiresAt: Date | null;

    @Column({ type: 'varchar', array: true, nullable: true })
    mimeType: string[] | null;

    @Column({ type: 'integer', nullable: true })
    size: number | null;

    @Column({ type: 'integer', nullable: true })
    minSize: number | null;

    @Column({ type: 'integer', nullable: true })
    maxSize: number | null;

    @Column({ type: 'varchar', nullable: true })
    etag: string | null;

    @Column({ type: 'varchar', nullable: true })
    clientId: string | null;

    @Column({ type: 'varchar', nullable: true })
    purpose: string | null;

    @Column({ type: 'varchar', nullable: true })
    fileableType: string | null;

    @Column({ type: 'varchar', nullable: true })
    fileableId: string | null;

    @Column({ type: 'boolean', default: false })
    downloadable: boolean;

    @Column({ type: 'uuid', nullable: true })
    verificationEventId: string | null;

    @Column({ type: 'timestamptz', nullable: true })
    verificationEventEmittedAt: Date | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date | null;
}
