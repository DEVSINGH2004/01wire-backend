import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as uuid from 'uuid';
import { PublicationCategoryEnum } from './enum/publication.category.enum';
import { PublicationLinkTypeEnum } from './enum/publication.link.type.enum';
import { PublicationTimelineEnum } from './enum/publication.timeline.enum';

type PublicationDocument = Publication & Document;

@Schema({ timestamps: true })
class Publication extends Document {
  @Prop({ type: String, default: () => uuid.v4() })
  _id: string;

  @Prop({
    type: String,
    required: true
  })
  title: string;

  @Prop({
    type: String,
    required: true
  })
  image: string;

  @Prop(
    raw({
      da: { type: Number, default: 0 },
      pa: { type: Number, default: 0 },
      dr: { type: Number, default: 0 },
      ur: { type: Number, default: 0 },
      traffic: { type: Number, default: 0 }
    })
  )
  stats: {
    da: number;
    pa: number;
    dr: number;
    ur: number;
    traffic: number;
  };

  @Prop({
    type: [String],
    enum: PublicationCategoryEnum,
    required: true
  })
  categories: PublicationCategoryEnum[];

  @Prop({
    type: String,
    enum: PublicationLinkTypeEnum,
    required: true
  })
  linkType: PublicationLinkTypeEnum;

  @Prop({
    type: String
  })
  sampleUrl: string;

  @Prop({
    type: String,
    enum: PublicationTimelineEnum,
    default: PublicationTimelineEnum.WEEK_1
  })
  timeline: PublicationTimelineEnum;

  @Prop({
    type: Number,
    required: true
  })
  price: number;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

const PublicationSchema = SchemaFactory.createForClass(Publication);

type PublicationTypeWithoutDocument = Omit<Publication, keyof Document> & {
  _id: string;
};

export { Publication, PublicationDocument, PublicationSchema, PublicationTypeWithoutDocument };
