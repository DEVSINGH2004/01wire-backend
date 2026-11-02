import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Default marketplace pricing. A single document with _id "default".
// price (credits) = ceil(vendorPriceInr * (1 + markup%) * (1 + gst%) / usdInrRate)
@Schema({ timestamps: true, collection: 'publication_settings' })
class PublicationSettings extends Document {
  @Prop({ type: String, default: 'default' })
  _id: string;

  @Prop({ type: Number, default: 45 })
  markupPercent: number;

  @Prop({ type: Number, default: 18 })
  gstPercent: number;

  @Prop({ type: Number, default: 95.62 })
  usdInrRate: number;

  @Prop()
  updatedAt: Date;
}

const PublicationSettingsSchema = SchemaFactory.createForClass(PublicationSettings);

export { PublicationSettings, PublicationSettingsSchema };
